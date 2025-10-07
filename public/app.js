let web3;
let userAddress;
let selectedNetwork;
let paymentData = {
    amount: 100,
    recipient: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
};

// Загрузка данных при старте
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/payment-data');
        paymentData = await response.json();
        updatePaymentDisplay();
    } catch (error) {
        console.error('Failed to load payment data:', error);
    }
});

async function connectWallet() {
    const connectBtn = document.getElementById('connectBtn');
    
    if (typeof window.ethereum !== 'undefined') {
        try {
            connectBtn.textContent = 'Connecting...';
            connectBtn.disabled = true;

            // Запрос подключения
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            userAddress = accounts[0];
            web3 = new Web3(window.ethereum);
            
            // Показываем следующий шаг
            showStep2();
            loadNetworks();
            
        } catch (error) {
            showError('Connection failed: ' + error.message);
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
    } else {
        showError('Please install MetaMask or other Web3 wallet!');
    }
}

function showStep2() {
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
}

function loadNetworks() {
    const networksList = document.getElementById('networksList');
    networksList.innerHTML = '';

    paymentData.networks.forEach(network => {
        const networkElement = document.createElement('div');
        networkElement.className = 'network-option';
        networkElement.innerHTML = `
            <input type="radio" name="network" value="${network.chainId}" 
                   onchange="selectNetwork('${network.chainId}')">
            <strong>${network.name}</strong>
            <br><small>Contract: ${network.contract.substring(0, 10)}...</small>
        `;
        networksList.appendChild(networkElement);
    });
}

function selectNetwork(chainId) {
    selectedNetwork = paymentData.networks.find(net => net.chainId === chainId);
    document.getElementById('sendBtn').disabled = !selectedNetwork;
}

async function sendTransaction() {
    if (!selectedNetwork) {
        showError('Please select a network');
        return;
    }

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;

    try {
        // Проверяем текущую сеть
        const currentChainId = await web3.eth.getChainId();
        if (currentChainId !== parseInt(selectedNetwork.chainId)) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: selectedNetwork.chainId }],
                });
            } catch (switchError) {
                // Если сеть не добавлена, добавляем её
                if (switchError.code === 4902) {
                    await addNetwork(selectedNetwork);
                } else {
                    throw switchError;
                }
            }
        }

        // ABI для функции transfer USDT
        const minABI = [
            {
                "constant": false,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ];

        const contract = new web3.eth.Contract(minABI, selectedNetwork.contract);
        const amountWei = web3.utils.toWei(paymentData.amount.toString(), 'mwei');

        // Отправка транзакции
        const transaction = await contract.methods.transfer(
            paymentData.recipient,
            amountWei
        ).send({
            from: userAddress,
            gas: 100000
        });

        showSuccess('Transaction successful! Hash: ' + transaction.transactionHash);

    } catch (error) {
        showError('Transaction failed: ' + error.message);
    }

    sendBtn.textContent = 'Confirm Payment';
    sendBtn.disabled = false;
}

async function addNetwork(network) {
    const networkParams = {
        [network.chainId]: {
            chainName: network.name,
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/']
        },
        '0x89': {
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com/']
        },
        '0x38': {
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
        }
    };

    await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkParams[network.chainId]],
    });
}

function updatePaymentDisplay() {
    document.getElementById('amountDisplay').textContent = paymentData.amount;
    document.getElementById('recipientDisplay').textContent = paymentData.recipient;
}

function showSuccess(message) {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.remove('hidden');
    document.getElementById('resultTitle').textContent = 'Success!';
    document.getElementById('resultTitle').className = 'success';
    document.getElementById('resultMessage').textContent = message;
}

function showError(message) {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.remove('hidden');
    document.getElementById('resultTitle').textContent = 'Error!';
    document.getElementById('resultTitle').className = 'error';
    document.getElementById('resultMessage').textContent = message;
}

function resetApp() {
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
    document.getElementById('connectBtn').textContent = 'Connect Wallet';
    document.getElementById('connectBtn').disabled = false;
    
    // Сброс выбора сети
    const radioButtons = document.querySelectorAll('input[name="network"]');
    radioButtons.forEach(radio => radio.checked = false);
    document.getElementById('sendBtn').disabled = true;
    selectedNetwork = null;
}