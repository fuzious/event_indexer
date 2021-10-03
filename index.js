const Web3 = require('web3');
const {ERC20ABI} = require('./erc20Abi.js');
const rpcURL = "https://eth-mainnet.alchemyapi.io/v2/DHLfTiMOWjuCKyY4bqu6OZ9Kz2coX5LG"
const web3 = new Web3(rpcURL);
const Contract = web3.eth.Contract;
const abiDecoder = require('abi-decoder'); 
const BigNumber = require('bignumber.js');


async function getAllEvents() {
    let allTx = (await web3.eth.getBlock(13341738)).transactions;
    abiDecoder.addABI(ERC20ABI);

    allTx.forEach( async (element) => {
        let txReceipt = await web3.eth.getTransactionReceipt(element);
        if (txReceipt.logs.length == 0) {
            return;
        }
        let contractAddress =txReceipt.logs[0].address;
        let contract = new Contract (ERC20ABI,contractAddress);
        txReceipt.logs.forEach(async(log) =>  {
            try {
                if (log.topics[0]!='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') 
                    return;
                let symbol = await contract.methods.symbol().call();
                let from = '0x'+log.topics[1].substr(26);
                let to = '0x'+log.topics[2].substr(26);
                let decimal = await contract.methods.decimals().call();
                let amount = new BigNumber(log.data,16);
                if (amount.isNaN()) {
                    throw 'not erc20';
                }
                amount = amount.dividedBy(Math.pow(10,decimal));
                console.log(log.transactionHash,amount.toFixed().toString(),symbol,from,to);
            } catch(e) {
                console.log('not an erc 20', contractAddress);
            }
        })
        
    });
}

getAllEvents()
