const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Основной маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint для получения данных транзакции
app.get('/api/payment-data', (req, res) => {
    res.json({
        amount: 100,
        token: 'USDT',
        recipient: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        networks: [
            {
                name: 'Ethereum',
                contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                chainId: '0x1'
            },
            {
                name: 'Polygon',
                contract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                chainId: '0x89'
            },
            {
                name: 'BNB Chain',
                contract: '0x55d398326f99059fF775485246999027B3197955',
                chainId: '0x38'
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});