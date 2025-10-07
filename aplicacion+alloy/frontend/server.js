const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para recibir logs del frontend
app.post('/log-error', (req, res) => {
    // Este error aparecerá en docker logs frontend-autos
    console.error(JSON.stringify(req.body));
    res.status(200).json({ success: true });
});

// Servir el index.html para todas las rutas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Frontend servidor corriendo en puerto ${PORT}`);
});