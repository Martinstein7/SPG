import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Constantes do Spotify
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';

app.get('/', (req, res) => {
  res.send('SPG Backend is running!');
});

// Endpoint para iniciar o login com o Spotify
app.get('/api/auth/login', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';
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
    
    // Redireciona de volta para o frontend com os tokens na URL (No MVP, faremos assim por simplicidade)
    res.redirect(`http://localhost:5173/?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
  } catch (error) {
    console.error('Erro na autenticação do Spotify:', error);
    res.redirect(`http://localhost:5173/?error=auth_failed`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

