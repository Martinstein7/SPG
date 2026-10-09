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

// Instância do Gemini
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

// Callback do Spotify após o login
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
    console.error('Erro na autenticação do Spotify:', error);
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
    // 1. Pedir pro Gemini gerar uma lista de 10 a 15 músicas perfeitas pro tema
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Você é um curador musical especialista. O usuário pediu uma playlist com a seguinte descrição: "${prompt}". 
      Recomende 15 músicas perfeitamente encaixadas nesse clima. Responda apenas com os dados no formato exigido, sem textos extras.`,
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

    const geminiOutput = response.text;
    if (!geminiOutput) throw new Error("Gemini retornou vazio");
    
    const suggestedTracks = JSON.parse(geminiOutput);

    // 2. Pegar o ID do usuário no Spotify
    const userProfileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userId = userProfileRes.data.id;

    // 3. Buscar as URIs das músicas no Spotify
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
        console.error(`Musica não encontrada: ${track.title}`);
      }
    }

    if (trackUris.length === 0) {
      return res.status(400).json({ error: 'Não foi possível encontrar músicas para essa vibe no Spotify.' });
    }

    // 4. Criar a Playlist no Spotify do Usuário
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

    // 5. Adicionar as músicas na playlist
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      uris: trackUris
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    // Pronto! Devolver pro Frontend
    res.json({ success: true, url: playlistUrl, playlistId });

  } catch (error: any) {
    console.error("Erro na geração da playlist:", error);
    
    // Tratamento para API do Gemini sobrecarregada
    if (error?.status === 503) {
      return res.status(503).json({ error: 'A IA do Google está com alta demanda no momento. Por favor, tente novamente em alguns segundos.' });
    }
    
    res.status(500).json({ error: 'Falha ao processar a requisição com a IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
