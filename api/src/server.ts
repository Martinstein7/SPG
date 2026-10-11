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
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state user-read-currently-playing';
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
  const { prompt, token, trackCount = 20 } = req.body;

  if (!prompt || !token) {
    return res.status(400).json({ error: 'Prompt ou Token ausente' });
  }

  const requestedCount = Math.min(Math.max(parseInt(trackCount, 10) || 20, 5), 50);

  try {
    // 1. Pedir pro Gemini gerar uma lista de musicas
    let geminiOutput = "";
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Voce e um curador musical especialista. O usuario pediu uma playlist com a seguinte descricao: "${prompt}". 
        Instrucoes:
        1. Gere exatamente ${requestedCount} musicas (nunca ultrapasse 50).
        2. As musicas devem ser perfeitamente encaixadas no clima e tema pedidos.
        3. Responda APENAS com o JSON no formato: [{"title": "nome", "artist": "artista"}].`,
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
            { role: "user", content: `O usuario pediu uma playlist com a seguinte descricao: "${prompt}". Gere exatamente ${requestedCount} musicas.` }
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
            { role: "user", content: `O usuario pediu uma playlist com a seguinte descricao: "${prompt}". Gere exatamente ${requestedCount} musicas.` }
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

    // 2. Buscar as URIs das musicas no Spotify
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

    // 3. Criar a Playlist no Spotify do Usuario (usa endpoint moderno /v1/me/playlists)
    let playlistName = prompt.substring(0, 50); // Fallback do nome
    if (playlistName.length === 50) playlistName += '...';

    const createPlaylistRes = await axios.post(`https://api.spotify.com/v1/me/playlists`, {
      name: `SPG: ${playlistName}`,
      description: `Playlist gerada por IA com base em: "${prompt}"`,
      public: false
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    const playlistId = createPlaylistRes.data.id;
    const playlistUrl = createPlaylistRes.data.external_urls.spotify;

    // 4. Adicionar as musicas na playlist (usa endpoint moderno /items do Spotify)
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
      uris: trackUris
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    // Pronto! Devolver pro Frontend
    res.json({ success: true, url: playlistUrl, playlistId, playlistName: `SPG: ${playlistName}`, trackCount: trackUris.length });

  } catch (error: any) {
    console.error("Erro na geracao da playlist:", error.response?.data || error.message || error);
    if (error?.message?.includes("Todas IAs falharam")) {
      return res.status(503).json({ error: 'As IAs falharam por limite de cota. Tente novamente mais tarde.' });
    }
    if (error.response?.data?.error?.message) {
      return res.status(500).json({ error: `Spotify: ${error.response.data.error.message}` });
    }
    res.status(500).json({ error: 'Falha ao processar a requisicao. Tente novamente mais tarde.' });
  }
});

// Endpoint para gerar sugestoes de playlists via IA
app.get('/api/suggestions', async (req, res) => {
  try {
    let aiOutput = "";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: "Você é um curador musical. Gere 4 ideias curtas (de 2 a 6 palavras) para temas de playlists do Spotify EM PORTUGUÊS DO BRASIL (PT-BR). Varie os temas entre: 1. Gêneros ou subgêneros (Ex: 'Indie Rock', 'Synthwave', 'Sertanejo Raiz'); 2. Épocas/Décadas (Ex: 'Rock Anos 2000', 'Flashback Anos 80'); 3. Misturas de artistas (Ex: 'TSL + Deftones + HIM', 'The Weeknd e similares'); 4. Situações reais (Ex: 'Dirigindo de madrugada', 'Treino pesado'). EVITE frases muito poéticas, abstratas ou sem nexo (como 'Céu noturno de neon' ou 'Sons da biblioteca antiga'). Responda APENAS com um JSON Array contendo as 4 strings, sem formatação markdown ou crases.",
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
            { role: "system", content: "Você é um curador musical. Gere 4 ideias curtas (de 2 a 6 palavras) para temas de playlists do Spotify EM PORTUGUÊS DO BRASIL (PT-BR). Varie os temas entre: 1. Gêneros ou subgêneros (Ex: 'Indie Rock', 'Synthwave', 'Sertanejo Raiz'); 2. Épocas/Décadas (Ex: 'Rock Anos 2000', 'Flashback Anos 80'); 3. Misturas de artistas (Ex: 'TSL + Deftones + HIM', 'The Weeknd e similares'); 4. Situações reais (Ex: 'Dirigindo de madrugada', 'Treino pesado'). EVITE frases muito poéticas, abstratas ou sem nexo (como 'Céu noturno de neon' ou 'Sons da biblioteca antiga'). Responda APENAS com um JSON Array contendo as 4 strings, sem formatação markdown ou crases." }
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
            { role: "system", content: "Você é um curador musical. Gere 4 ideias curtas (de 2 a 6 palavras) para temas de playlists do Spotify EM PORTUGUÊS DO BRASIL (PT-BR). Varie os temas entre: 1. Gêneros ou subgêneros (Ex: 'Indie Rock', 'Synthwave', 'Sertanejo Raiz'); 2. Épocas/Décadas (Ex: 'Rock Anos 2000', 'Flashback Anos 80'); 3. Misturas de artistas (Ex: 'TSL + Deftones + HIM', 'The Weeknd e similares'); 4. Situações reais (Ex: 'Dirigindo de madrugada', 'Treino pesado'). EVITE frases muito poéticas, abstratas ou sem nexo (como 'Céu noturno de neon' ou 'Sons da biblioteca antiga'). Responda APENAS com um JSON Array contendo as 4 strings, sem formatação markdown ou crases." }
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

// Endpoint para expandir playlist existente com IA
app.post('/api/playlist/append-ai', async (req, res) => {
  const { playlistId, prompt, token, trackCount = 10, existingTracks, playlistName: reqPlName, playlistDesc: reqPlDesc } = req.body;

  if (!playlistId || !token) {
    return res.status(400).json({ error: 'Playlist ID ou Token ausente' });
  }

  const requestedCount = Math.min(Math.max(parseInt(trackCount, 10) || 10, 1), 30);

  try {
    // 1. Buscar detalhes da playlist e músicas existentes para dar contexto real à IA
    let playlistName = reqPlName || '';
    let playlistDesc = reqPlDesc || '';
    let existingSongList: string[] = Array.isArray(existingTracks) && existingTracks.length > 0 ? existingTracks : [];

    if (existingSongList.length === 0 || !playlistName) {
      try {
        const playlistDetails = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!playlistName) playlistName = playlistDetails.data.name || '';
        if (!playlistDesc) playlistDesc = playlistDetails.data.description || '';
        if (existingSongList.length === 0) {
          const existingItems = playlistDetails.data.items?.items || playlistDetails.data.tracks?.items || [];
          existingSongList = existingItems.slice(0, 25).map((i: any) => {
            const track = i.item || i.track;
            if (!track) return null;
            return `"${track.name}" (${track.artists?.map((a: any) => a.name).join(', ')})`;
          }).filter(Boolean);
        }
      } catch (fetchErr) {
        console.warn("Não foi possível obter dados prévios da playlist para contexto:", fetchErr);
      }
    }

    const aiPromptInstructions = `Você é um curador musical especialista. O usuário quer expandir uma playlist existente.
INFORMAÇÕES DA PLAYLIST:
- Nome da Playlist: "${playlistName || 'Playlist'}"
- Descrição: "${playlistDesc || 'Sem descrição'}"
- Amostra de músicas que JÁ ESTÃO nesta playlist: ${existingSongList.length > 0 ? existingSongList.join('; ') : 'Nenhuma listada'}

${prompt && prompt.trim() ? `O usuário fez o seguinte pedido adicional: "${prompt}".` : 'O usuário não forneceu instruções extras de texto. Portanto, analise com extremo cuidado o gênero, a sonoridade e os artistas das músicas já presentes na playlist para manter a mesma vibe.'}

REGRAS OBRIGATÓRIAS E CRÍTICAS:
1. Mantenha ESTRITAMENTE o mesmo gênero, atmosfera e estilo musical das músicas já presentes. Exemplo: se a playlist for de Grunge/Rock alternativo anos 90 (como Alice in Chains, Nirvana, Pearl Jam), JAMAIS gere K-Pop, Sertanejo, Funk ou pop desconexo.
2. NÃO repita nenhuma das músicas que já estão na playlist.
3. Gere exatamente ${requestedCount} músicas compatíveis e naturais para essa playlist.
4. Responda APENAS com o JSON no formato: [{"title": "nome", "artist": "artista"}]. Sem formatação markdown ou crases.`;

    let geminiOutput = "";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: aiPromptInstructions,
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
      console.error("Gemini falhou na adição, usando Groq...", geminiError.message);
      if (process.env.GROQ_API_KEY) {
        try {
          const { OpenAI } = require('openai');
          const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
          const groqResponse = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
              { role: "system", content: "Você é um curador musical especialista. Responda APENAS com um JSON Array contendo objetos com 'title' e 'artist'. Sem markdown ou explicações." },
              { role: "user", content: aiPromptInstructions }
            ],
            temperature: 0.7
          });
          geminiOutput = groqResponse.choices[0]?.message?.content || "";
        } catch (groqErr: any) {
          console.error("Groq falhou na adição:", groqErr.message);
        }
      }
    }

    if (!geminiOutput) throw new Error("A IA não retornou faixas");

    const jsonMatch = geminiOutput.match(/\[[\s\S]*\]/);
    const cleanOutput = jsonMatch ? jsonMatch[0] : geminiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const suggestedTracks = JSON.parse(cleanOutput);

    // Buscar URIs no Spotify
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
      return res.status(400).json({ error: 'Nao foi possivel encontrar as musicas no Spotify.' });
    }

    // Adiciona na playlist existente usando endpoint moderno /items
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
      uris: trackUris
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    res.json({ success: true, addedCount: trackUris.length, tracks: suggestedTracks });
  } catch (error: any) {
    console.error("Erro ao adicionar faixas:", error.response?.data || error.message || error);
    res.status(500).json({ error: error.response?.data?.error?.message || 'Falha ao adicionar músicas à playlist.' });
  }
});

// Endpoint para adicionar uma música específica manualmente
app.post('/api/playlist/append-track', async (req, res) => {
  const { playlistId, uri, token } = req.body;
  if (!playlistId || !uri || !token) return res.status(400).json({ error: 'Dados ausentes' });

  try {
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
      uris: [uri]
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao adicionar faixa:", error.response?.data || error.message || error);
    res.status(500).json({ error: error.response?.data?.error?.message || 'Falha ao adicionar música.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
