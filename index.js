const Web3 = require('web3');
const {ERC20ABI} = require('./erc20Abi.js');
const rpcURL = "wss://eth-rinkeby.alchemyapi.io/v2/BJe-5iMb10QsmZxQihjZ9DGU6lc2EBhN"
const web3 = new Web3(rpcURL);
const Contract = web3.eth.Contract;
const BigNumber = require('bignumber.js');
const mysql = require('mysql');
const express = require("express");
const  app = express();
require('dotenv').config()

app.use(express.json());


// connect to DB
var mysqlConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: 'event_index',
    multipleStatements: true
});

mysqlConnection.connect((err)=> {
    if(!err)
    console.log('Connection Established Successfully');
    else
    console.log('Connection Failed!'+ JSON.stringify(err,undefined,2));
    });

// subscribe each new block formed
var subscription = web3.eth.subscribe('newBlockHeaders', function(error, result){
    if (!error) {
        console.log('blockNumber '+(result.number-6));
        getAllEvents(result.number-6);
        return;
    }

    console.error(error);
})
.on("error", console.error);


async function getAllEvents(blockNumber) {
    let allTx = (await web3.eth.getBlock(blockNumber)).transactions;

    allTx.forEach( async (element) => {
        let txReceipt = await web3.eth.getTransactionReceipt(element);
        if (txReceipt.logs.length == 0) {
            return;
        }
        // fetch contract address from logs
        let contractAddress =txReceipt.logs[0].address;
        let contract = new Contract (ERC20ABI,contractAddress);
        txReceipt.logs.forEach(async(log) =>  {
            try {
                // this hash identifies a transfer event
                if (log.topics[0]!='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') 
                    return;

                // fetching symbols and details of transactions
                let symbol = await contract.methods.symbol().call();
                let from = '0x'+log.topics[1].substr(26);
                let to = '0x'+log.topics[2].substr(26);
                let decimal = await contract.methods.decimals().call();
                let amount = new BigNumber(log.data,16);
                if (amount.isNaN()) {
                    throw 'not erc20';
                }

                // dividing tokens by 10^decimal 
                amount = amount.dividedBy(Math.pow(10,decimal));
                // console.log(log.transactionHash,amount.toFixed().toString(),symbol,from,to);

                // persisting to DB
                mysqlConnection.query(`INSERT INTO event_index.tx_log (tx_hash,logIndex,sender,receiver,amount,token) VALUES ("${log.transactionHash}","${log.logIndex}","${from}","${to}","${log.transactionHash,amount.toFixed().toString()}","${symbol}")`, (err, rows, fields) => {
                    if (err)
                        console.log(err);
                    });
            } catch(e) {
                console.log('not an erc 20', contractAddress);
            }
        })
        
    });
}

app.get("/fetchSendersDetails", (req, res, next) => {
    console.log(req.query.sender);
    mysqlConnection.query(`select * from event_index.tx_log where sender = "${req.query.sender}"`, (err, rows, fields) => {
        if (!err) {

            res.send({'all_txs':rows,'transfer_count':rows.length});
        } else {
            res.send(err)
        }
    })
});

// start server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});