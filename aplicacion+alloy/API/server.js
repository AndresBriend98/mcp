const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Configuración de la conexión a SQL Server
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong@Password123',
    server: process.env.DB_SERVER || 'sqlserver',
    database: process.env.DB_NAME || 'AutosDB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Pool de conexiones
let poolPromise;

const getPool = async () => {
    if (!poolPromise) {
        poolPromise = sql.connect(config);
    }
    return poolPromise;
};

// Middleware para verificar conexión
app.use(async (req, res, next) => {
    try {
        await getPool();
        next();
    } catch (err) {
        console.error('Error de conexión a la base de datos:', err);
        res.status(500).json({ 
            error: 'Error de conexión a la base de datos',
            details: err.message 
        });
    }
});

// ========== RUTAS ==========

// GET / - Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'API de Autos funcionando correctamente',
        version: '1.0.0',
        endpoints: {
            'GET /autos': 'Obtener todos los autos',
            'GET /autos/:id': 'Obtener un auto por ID',
            'POST /autos': 'Crear un nuevo auto',
            'PUT /autos/:id': 'Actualizar un auto completo',
            'PATCH /autos/:id': 'Actualizar campos específicos de un auto',
            'DELETE /autos/:id': 'Eliminar un auto'
        }
    });
});

// GET /autos - Obtener todos los autos
app.get('/autos', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM Autos ORDER BY Id DESC');
        
        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error al obtener autos:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener los autos',
            details: err.message 
        });
    }
});

// GET /autos/:id - Obtener un auto por ID
app.get('/autos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Autos WHERE Id = @id');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Auto no encontrado' 
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al obtener auto:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener el auto',
            details: err.message 
        });
    }
});

// POST /autos - Crear un nuevo auto
app.post('/autos', async (req, res) => {
    try {
        const { modelo, marca, anio } = req.body;
        
        // Validaciones
        if (!modelo || !marca || !anio) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos requeridos: modelo, marca, anio' 
            });
        }
        
        if (typeof anio !== 'number' || anio < 1900 || anio > 2100) {
            return res.status(400).json({ 
                success: false,
                error: 'El año debe ser un número válido entre 1900 y 2100' 
            });
        }
        
        const pool = await getPool();
        const result = await pool.request()
            .input('modelo', sql.NVarChar(100), modelo)
            .input('marca', sql.NVarChar(100), marca)
            .input('anio', sql.Int, anio)
            .query(`
                INSERT INTO Autos (Modelo, Marca, Anio) 
                OUTPUT INSERTED.*
                VALUES (@modelo, @marca, @anio)
            `);
        
        res.status(201).json({
            success: true,
            message: 'Auto creado exitosamente',
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al crear auto:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al crear el auto',
            details: err.message 
        });
    }
});

// PUT /autos/:id - Actualizar un auto completo
app.put('/autos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { modelo, marca, anio } = req.body;
        
        // Validaciones
        if (!modelo || !marca || !anio) {
            return res.status(400).json({ 
                success: false,
                error: 'Faltan campos requeridos: modelo, marca, anio' 
            });
        }
        
        if (typeof anio !== 'number' || anio < 1900 || anio > 2100) {
            return res.status(400).json({ 
                success: false,
                error: 'El año debe ser un número válido entre 1900 y 2100' 
            });
        }
        
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('modelo', sql.NVarChar(100), modelo)
            .input('marca', sql.NVarChar(100), marca)
            .input('anio', sql.Int, anio)
            .query(`
                UPDATE Autos 
                SET Modelo = @modelo, Marca = @marca, Anio = @anio
                OUTPUT INSERTED.*
                WHERE Id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Auto no encontrado' 
            });
        }
        
        res.json({
            success: true,
            message: 'Auto actualizado exitosamente',
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al actualizar auto:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar el auto',
            details: err.message 
        });
    }
});

// PATCH /autos/:id - Actualizar campos específicos
app.patch('/autos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { modelo, marca, anio } = req.body;
        
        // Validar que al menos un campo esté presente
        if (!modelo && !marca && !anio) {
            return res.status(400).json({ 
                success: false,
                error: 'Debe proporcionar al menos un campo para actualizar' 
            });
        }
        
        // Validar año si se proporciona
        if (anio && (typeof anio !== 'number' || anio < 1900 || anio > 2100)) {
            return res.status(400).json({ 
                success: false,
                error: 'El año debe ser un número válido entre 1900 y 2100' 
            });
        }
        
        // Construir la query dinámicamente
        const updates = [];
        const request = (await getPool()).request();
        request.input('id', sql.Int, id);
        
        if (modelo) {
            updates.push('Modelo = @modelo');
            request.input('modelo', sql.NVarChar(100), modelo);
        }
        if (marca) {
            updates.push('Marca = @marca');
            request.input('marca', sql.NVarChar(100), marca);
        }
        if (anio) {
            updates.push('Anio = @anio');
            request.input('anio', sql.Int, anio);
        }
        
        const query = `
            UPDATE Autos 
            SET ${updates.join(', ')}
            OUTPUT INSERTED.*
            WHERE Id = @id
        `;
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Auto no encontrado' 
            });
        }
        
        res.json({
            success: true,
            message: 'Auto actualizado exitosamente',
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error al actualizar auto:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar el auto',
            details: err.message 
        });
    }
});

// DELETE /autos/:id - Eliminar un auto
app.delete('/autos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        
        // Primero obtener el auto antes de eliminarlo
        const autoResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Autos WHERE Id = @id');
        
        if (autoResult.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Auto no encontrado' 
            });
        }
        
        // Eliminar el auto
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Autos WHERE Id = @id');
        
        res.json({
            success: true,
            message: 'Auto eliminado exitosamente',
            data: autoResult.recordset[0]
        });
    } catch (err) {
        console.error('Error al eliminar auto:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error al eliminar el auto',
            details: err.message 
        });
    }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Ruta no encontrada' 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor API corriendo en el puerto ${PORT}`);
    console.log(`📡 Endpoint: http://localhost:${PORT}`);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n⚠️  Cerrando servidor...');
    if (poolPromise) {
        await (await poolPromise).close();
        console.log('✅ Conexiones cerradas');
    }
    process.exit(0);
});