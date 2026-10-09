import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenAI, Type, Schema } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Constantes do Spotify
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://127.0.0.1:3000/api/auth/callback';

// Instancia do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('SPG Backend is running!');
});

// Endpoint para iniciar o login com o Spotify
app.get('/api/auth/login', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
  const authQueryParameters = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID as string,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${authQueryParameters.toString()}`);
});

// Callback do Spotify apos o login
app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code as string;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Redireciona de volta para o frontend com os tokens na URL
    res.redirect(`http://localhost:5173/?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
  } catch (error) {
    console.error('Erro na autenticacao do Spotify:', error);
    res.redirect(`http://localhost:5173/?error=auth_failed`);
  }
});

// ENDPOINT PRINCIPAL DA NOSSA IA
app.post('/api/generate', async (req, res) => {
  const { prompt, token } = req.body;

  if (!prompt || !token) {
    return res.status(400).json({ error: 'Prompt ou Token ausente' });
  }

  try {
    // 1. Pedir pro Gemini gerar uma lista de musicas
    let geminiOutput = "";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Voce e um curador musical especialista. O usuario pediu uma playlist com a seguinte descricao: "${prompt}". 
        Instrucoes:
        1. Identifique se o usuario pediu uma quantidade especifica de musicas. Se sim, gere exatamente essa quantidade, MAS NUNCA ultrapasse o limite de 50 musicas.
        2. Se o usuario nao especificou uma quantidade, gere 15 musicas.
        3. As musicas devem ser perfeitamente encaixadas no clima e tema pedidos.
        4. Responda APENAS com o JSON no formato: [{"title": "nome", "artist": "artista"}].`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING }
              },
              required: ["title", "artist"]
            }
          }
        }
      });
      geminiOutput = response.text || "";
    } catch (geminiError: any) {
      console.error("Gemini falhou, iniciando plano B (Groq)...", geminiError.message);
      try {
        if (!process.env.GROQ_API_KEY) throw new Error("Sem chave Groq");
        const { OpenAI } = require('openai');
        const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
        const groqResponse = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: "Voce e um curador musical especialista. Responda APENAS com um JSON Array contendo objetos com 'title' e 'artist'. Sem markdown." },
            { role: "user", content: `O usuario pediu uma playlist com a seguinte descricao: "${prompt}". Se ele pediu uma quantidade especifica, obedeca (maximo 50). Caso contrario, gere 15 musicas.` }
          ],
          temperature: 0.7
        });
        geminiOutput = groqResponse.choices[0].message.content || "";
      } catch (groqError: any) {
        console.error("Groq falhou, iniciando plano C (OpenAI)...", groqError.message);
        if (!process.env.OPENAI_API_KEY) throw new Error("Todas IAs falharam.");
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Voce e um curador musical especialista. Responda APENAS com um JSON Array contendo objetos com 'title' e 'artist'. Sem markdown." },
            { role: "user", content: `O usuario pediu uma playlist com a seguinte descricao: "${prompt}". Se ele pediu uma quantidade especifica, obedeca (maximo 50). Caso contrario, gere 15 musicas.` }
          ],
          temperature: 0.7
        });
        geminiOutput = gptResponse.choices[0].message.content || "";
      }
    }

    if (!geminiOutput) throw new Error("A IA retornou vazio");
    
    // Limpar o JSON
    const cleanOutput = geminiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestedTracks = JSON.parse(cleanOutput);

    // 2. Pegar o ID do usuario no Spotify
    const userProfileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userId = userProfileRes.data.id;

    // 3. Buscar as URIs das musicas no Spotify
    const trackUris: string[] = [];
    for (const track of suggestedTracks) {
      const q = encodeURIComponent(`track:${track.title} artist:${track.artist}`);
      try {
        const searchRes = await axios.get(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (searchRes.data.tracks.items.length > 0) {
          trackUris.push(searchRes.data.tracks.items[0].uri);
        }
      } catch (e) {
        console.error(`Musica nao encontrada: ${track.title}`);
      }
    }

    if (trackUris.length === 0) {
      return res.status(400).json({ error: 'Nao foi possivel encontrar musicas para essa vibe no Spotify.' });
    }

    // 4. Criar a Playlist no Spotify do Usuario
    let playlistName = prompt.substring(0, 50); // Fallback do nome
    if (playlistName.length === 50) playlistName += '...';

    const createPlaylistRes = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      name: `SPG: ${playlistName}`,
      description: `Playlist gerada por IA com base em: "${prompt}"`,
      public: false
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    const playlistId = createPlaylistRes.data.id;
    const playlistUrl = createPlaylistRes.data.external_urls.spotify;

    // 5. Adicionar as musicas na playlist
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      uris: trackUris
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    // Pronto! Devolver pro Frontend
    res.json({ success: true, url: playlistUrl, playlistId });

  } catch (error: any) {
    console.error("Erro na geracao da playlist:", error);
    if (error?.message?.includes("Todas IAs falharam")) {
      return res.status(503).json({ error: 'O Gemini falhou por alta demanda e as IAs de fallback (Groq/OpenAI) nao estao configuradas ou sem limite.' });
    }
    res.status(500).json({ error: 'Falha ao processar a requisicao com a IA. Tente novamente mais tarde.' });
  }
});

// Endpoint para gerar sugestoes de playlists via IA
app.get('/api/suggestions', async (req, res) => {
  try {
    let aiOutput = "";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: "Gere 4 ideias criativas, diferentes e curtas (ate 5 palavras) para temas inusitados de playlists do Spotify (Ex: 'Faxina no sabado de manha', 'Chorando no banho', 'Correndo de zumbis'). Responda apenas com um JSON Array contendo 4 strings.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      aiOutput = response.text || "";
    } catch (geminiError: any) {
      console.error("Gemini falhou ao gerar sugestoes:", geminiError.message);
      console.error("Tentando com Groq...");
      try {
        if (!process.env.GROQ_API_KEY) throw new Error("Sem chave Groq");
        const { OpenAI } = require('openai');
        const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
        const groqResponse = await groq.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: "Voce e um curador musical. Responda APENAS com um JSON Array contendo 4 strings curtas (ate 5 palavras) com ideias de temas inusitados e criativos para playlists. Sem markdown." }
          ],
          temperature: 0.9
        });
        aiOutput = groqResponse.choices[0].message.content || "";
      } catch (groqError: any) {
        console.error("Groq falhou, tentando OpenAI...", groqError.message);
        if (!process.env.OPENAI_API_KEY) throw new Error("Sem chaves de IA");
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "Voce e um curador musical. Responda APENAS com um JSON Array contendo 4 strings curtas (ate 5 palavras) com ideias de temas inusitados e criativos para playlists. Sem markdown." }
          ],
          temperature: 0.9
        });
        aiOutput = gptResponse.choices[0].message.content || "";
      }
    }
    
    const cleanOutput = aiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestions = JSON.parse(cleanOutput);
    res.json({ suggestions });
  } catch (error) {
    console.error("Erro ao gerar sugestoes:", error);
    res.json({ suggestions: ["Vampiro melancólico", "Dirigindo de madrugada", "TSL + Deftones + HIM", "Anos 2000"] });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
