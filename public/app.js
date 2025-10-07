let web3;
let userAddress;
let selectedContract;

// Показ модального окна выбора кошелька
function showWalletModal() {
    document.getElementById('walletModal').style.display = 'block';
}

// Скрытие модального окна
function hideWalletModal() {
    document.getElementById('walletModal').style.display = 'none';
}

// Подключение MetaMask
async function connectMetaMask() {
    hideWalletModal();
    await connectWallet('metamask');
}

// Подключение Trust Wallet
async function connectTrustWallet() {
    hideWalletModal();
    await connectWallet('trustwallet');
}

// Подключение через WalletConnect
async function connectWalletConnect() {
    hideWalletModal();
    showStatus('Please use your wallet browser to connect directly', 'info');
}

// Основная функция подключения
async function connectWallet(walletType) {
    const mainBtn = document.getElementById('mainBtn');
    
    if (typeof window.ethereum !== 'undefined') {
        try {
            showStatus('Connecting to wallet...', 'info');
            mainBtn.disabled = true;
            mainBtn.textContent = 'Connecting...';

            // Запрос аккаунтов - это вызовет окно MetaMask
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            userAddress = accounts[0];
            web3 = new Web3(window.ethereum);
            
            showStatus(`✅ Connected: ${userAddress.substring(0, 8)}...`, 'success');
            mainBtn.textContent = `✅ Connected`;
            
            // Показываем интерфейс платежа
            showPaymentInterface();
            
        } catch (error) {
            if (error.code === 4001) {
                showStatus('❌ Connection rejected by user', 'error');
            } else {
                showStatus('❌ Connection failed: ' + error.message, 'error');
            }
            mainBtn.disabled = false;
            mainBtn.textContent = '🦊 Pay with Web3 Wallet';
        }
    } else {
        showStatus('❌ Web3 wallet not detected. Please install MetaMask or use a Web3-enabled browser.', 'error');
        
        // Предлагаем установить MetaMask
        if (confirm('MetaMask not found. Would you like to install it?')) {
            window.open('https://metamask.io/download/', '_blank');
        }
    }
}

// Показать интерфейс платежа
function showPaymentInterface() {
    document.getElementById('paymentInterface').classList.remove('hidden');
    document.getElementById('connectedAddress').textContent = 
        `${userAddress.substring(0, 8)}...${userAddress.substring(userAddress.length - 6)}`;
}

// Обновить выбранную сеть
function updateNetwork() {
    const networkSelect = document.getElementById('networkSelect');
    const selectedOption = networkSelect.options[networkSelect.selectedIndex];
    selectedContract = selectedOption.getAttribute('data-contract');
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = !selectedContract;
    
    if (selectedContract) {
        showStatus(`✅ Selected network: ${selectedOption.text}`, 'info');
    }
}

// Отправка USDT
async function sendUSDT() {
    if (!selectedContract) {
        showStatus('❌ Please select a network first', 'error');
        return;
    }

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.textContent = '⏳ Sending...';
    sendBtn.disabled = true;

    try {
        showStatus('Preparing transaction...', 'info');

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

        const contract = new web3.eth.Contract(minABI, selectedContract);
        
        // 100 USDT в наименьших единицах (6 decimals)
        const amountWei = web3.utils.toWei('100', 'mwei');
        const recipient = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

        showStatus('Please confirm transaction in your wallet...', 'info');

        // Отправка транзакции - вызовет окно подтверждения в MetaMask
        const transaction = await contract.methods.transfer(recipient, amountWei)
            .send({
                from: userAddress,
                gas: 100000
            });

        showStatus(`✅ Transaction successful! Hash: ${transaction.transactionHash.substring(0, 10)}...`, 'success');
        sendBtn.textContent = '✅ Sent!';

    } catch (error) {
        console.error('Transaction error:', error);
        
        if (error.code === 4001) {
            showStatus('❌ Transaction rejected by user', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showStatus('❌ Insufficient funds for transaction', 'error');
        } else {
            showStatus('❌ Transaction failed: ' + error.message, 'error');
        }
        
        sendBtn.textContent = '💸 Send 100 USDT';
        sendBtn.disabled = false;
    }
}

// Показать статус
function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
}

// Закрыть модальное окно при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('walletModal');
    if (event.target === modal) {
        hideWalletModal();
    }
}

// Проверить, подключен ли уже кошелек
window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                // Автоматически подключиться, если уже разрешено
                userAddress = accounts[0];
                web3 = new Web3(window.ethereum);
                showStatus(`✅ Connected: ${userAddress.substring(0, 8)}...`, 'success');
                document.getElementById('mainBtn').textContent = `✅ Connected`;
                showPaymentInterface();
            }
        } catch (error) {
            console.log('No previous connection found');
        }
    }
});
