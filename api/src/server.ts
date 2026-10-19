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
const SPOTIFY_CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || '').trim();
const SPOTIFY_CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
const REDIRECT_URI = (process.env.REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/callback').trim();
const rawFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/$/, '');
const FRONTEND_URL = rawFrontendUrl.startsWith('http://') || rawFrontendUrl.startsWith('https://')
  ? rawFrontendUrl
  : `https://${rawFrontendUrl}`;

// Instancia do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.send('SPG Backend is running!');
});


// Endpoint para iniciar o login com o Spotify
app.get('/api/auth/login', (req, res) => {
  try {
    const scope = 'user-read-private user-read-email ugc-image-upload playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state user-read-currently-playing';
    const authQueryParameters = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      show_dialog: 'true',
    });

    res.redirect(`https://accounts.spotify.com/authorize?${authQueryParameters.toString()}`);
  } catch (err: any) {
    console.error('Erro ao iniciar login:', err);
    res.status(500).send(`Erro ao iniciar autenticacao: ${err?.message || err}`);
  }
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
    res.redirect(`${FRONTEND_URL}/?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
  } catch (error) {
    console.error('Erro na autenticacao do Spotify:', error);
    res.redirect(`${FRONTEND_URL}/?error=auth_failed`);
  }
});

// Endpoint para renovar o access_token quando expirar (evita travar na tela após 1h)
app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token ausente' });
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      }
    });

    const { access_token, expires_in, refresh_token: new_refresh_token } = response.data;
    res.json({
      access_token,
      expires_in,
      refresh_token: new_refresh_token || refresh_token
    });
  } catch (error: any) {
    console.error('Erro ao renovar token do Spotify:', error.response?.data || error.message);
    res.status(401).json({ error: 'Falha ao renovar sessao do Spotify' });
  }
});

// Funcao auxiliar para gerar capa de playlist com IA (<256KB JPEG) e enviar para o Spotify
async function generateAndUploadPlaylistCover(
  playlistId: string,
  themeDescription: string,
  token: string
): Promise<{ uploaded: boolean; coverUrl: string | null; errorStatus?: number; errorMessage?: string }> {
  const cleanTheme = themeDescription.replace(/^SPG:\s*/i, '').trim() || 'musica e emocao';
  let visualPrompt = `music album cover art representing "${cleanTheme}", aesthetic digital illustration, atmospheric lighting, square vinyl art, no text, no letters`;

  // Tenta enriquecer o prompt visual rapidamente em inglês para gerar uma arte ainda mais fiel
  try {
    const promptInstruction = `Transforme este tema de playlist musical em uma descrição visual curta em inglês (máximo 18 palavras) para uma capa de álbum artística, sem textos nem palavras escritas na imagem. Tema: "${cleanTheme}". Responda APENAS a frase em inglês.`;
    if (process.env.GROQ_API_KEY) {
      const { OpenAI } = require('openai');
      const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const groqRes = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: promptInstruction }],
        temperature: 0.7
      });
      const refined = groqRes.choices[0]?.message?.content?.trim();
      if (refined && refined.length > 5) {
        visualPrompt = `${refined.replace(/["']/g, '')}, square music album cover art, high quality digital painting, no text`;
      }
    }
  } catch {
    // Segue com o visualPrompt padrão caso a tradução falhe
  }

  const seed = Math.floor(Math.random() * 1000000);
  const fetchImageBase64 = async (size: number): Promise<string> => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=${size}&height=${size}&nologo=true&seed=${seed}`;
    const imgRes = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 22000
    });
    return Buffer.from(imgRes.data).toString('base64');
  };

  let base64Image = '';
  try {
    base64Image = await fetchImageBase64(512);
    // O Spotify exige no máximo 256 KB no payload Base64
    if (base64Image.length > 245000) {
      base64Image = await fetchImageBase64(384);
    }
  } catch (imgErr: any) {
    console.warn('Pollinations demorou ou falhou, usando fallback artístico para capa:', imgErr.message);
    try {
      const fallbackRes = await axios.get(`https://picsum.photos/seed/${seed}/500/500.jpg`, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      base64Image = Buffer.from(fallbackRes.data).toString('base64');
    } catch (fbErr: any) {
      return { uploaded: false, coverUrl: null, errorMessage: 'Não foi possível gerar a imagem de capa no momento.' };
    }
  }

  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  try {
    await axios.put(
      `https://api.spotify.com/v1/playlists/${playlistId}/images`,
      base64Image,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/jpeg'
        }
      }
    );
    return { uploaded: true, coverUrl: dataUrl };
  } catch (uploadErr: any) {
    const status = uploadErr.response?.status;
    console.error('Erro ao enviar capa para o Spotify:', status, uploadErr.response?.data || uploadErr.message);
    return {
      uploaded: false,
      coverUrl: dataUrl,
      errorStatus: status,
      errorMessage:
        status === 401 || status === 403
          ? 'Permissão de imagem pendente: clique em "Sair" e conecte sua conta do Spotify novamente para autorizar a troca de capas.'
          : 'Não foi possível salvar a capa no Spotify.'
    };
  }
}

// ENDPOINT PRINCIPAL DA NOSSA IA
app.post('/api/generate', async (req, res) => {
  const { prompt, token, trackCount = 20, generateCover = true } = req.body;

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

    // 5. Gerar e aplicar capa personalizada com IA por padrão
    let coverUrl: string | null = null;
    let coverUploaded = false;
    if (generateCover !== false) {
      const coverResult = await generateAndUploadPlaylistCover(playlistId, prompt, token);
      coverUrl = coverResult.coverUrl;
      coverUploaded = coverResult.uploaded;
    }

    // Pronto! Devolver pro Frontend
    res.json({
      success: true,
      url: playlistUrl,
      playlistId,
      playlistName: `SPG: ${playlistName}`,
      trackCount: trackUris.length,
      coverUrl,
      coverUploaded
    });

  } catch (error: any) {
    console.error("Erro na geracao da playlist:", error.response?.data || error.message || error);
    if (error?.message?.includes("Todas IAs falharam")) {
      return res.status(503).json({ error: 'As IAs falharam por limite de cota. Tente novamente mais tarde.' });
    }
    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Sua conta do Spotify ainda não está liberada no painel de desenvolvedor do app (User Management no Spotify Developer Dashboard).'
      });
    }
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Sua sessão do Spotify expirou. Saia e conecte sua conta novamente.'
      });
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
    const parsed = JSON.parse(cleanOutput);
    const rawArray = Array.isArray(parsed) ? parsed : [];
    const suggestions = rawArray
      .map((item: any) => (typeof item === 'string' ? item : item?.theme || item?.title || item?.name || ''))
      .filter((s: string) => s.length > 0);

    res.json({
      suggestions: suggestions.length > 0 ? suggestions : ["Vampiro melancólico", "Dirigindo de madrugada", "TSL + Deftones + HIM", "Anos 2000"]
    });
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

// Endpoint para gerar e alterar a capa de uma playlist existente com IA
app.post('/api/playlist/cover-ai', async (req, res) => {
  const { playlistId, playlistName, playlistDesc, existingTracks, prompt, token } = req.body;
  if (!playlistId || !token) {
    return res.status(400).json({ error: 'Playlist ID ou Token ausente' });
  }

  const customPrompt = (prompt || '').trim();
  const cleanTitle = (playlistName || 'Playlist Musical').replace(/^SPG:\s*/i, '').trim();
  const sampleArtists = Array.isArray(existingTracks) && existingTracks.length > 0
    ? existingTracks.slice(0, 5).join(', ')
    : '';

  const themeDescription = customPrompt
    ? `${customPrompt} (Playlist: ${cleanTitle})`
    : `${cleanTitle}${playlistDesc ? ` - ${playlistDesc}` : ''}${sampleArtists ? ` (Estilo de: ${sampleArtists})` : ''}`;

  try {
    const result = await generateAndUploadPlaylistCover(playlistId, themeDescription, token);
    if (result.uploaded && result.coverUrl) {
      return res.json({ success: true, coverUrl: result.coverUrl });
    }
    return res.status(result.errorStatus || 500).json({
      error: result.errorMessage || 'Não foi possível atualizar a capa da playlist.',
      coverUrl: result.coverUrl
    });
  } catch (error: any) {
    console.error('Erro em /api/playlist/cover-ai:', error.message || error);
    res.status(500).json({ error: 'Erro interno ao gerar capa com IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
