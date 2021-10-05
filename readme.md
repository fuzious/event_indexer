# Table Schema:
```
 CREATE TABLE
      tx_log (
          tx_hash varchar(255) NOT NULL,
          logIndex INT NOT NULL,
          sender varchar(255) NOT NULL,
          receiver varchar(255) NOT NULL,
          amount varchar(255) NOT NULL,
          token varchar(255) NOT NULL,
          PRIMARY KEY(tx_hash, logIndex)
     );

     CREATE INDEX sender ON tx_log (sender);

```
MySQL used for ACID compliance and 3rd normal form. 

Primary Key is transaction hash and log index to identify each unique transfer event.
sender has been indexed because of it being the prime attributes for querying the data.

# Methodology:

Subscribe to each new block formed say n, and get all the transactions of (n-6)th block for a re-org proof indexing.

For each contract interacting transaction, fetch the logs and then for each `trasnfer` event log find the `from` which is the caller, `to` can be fetched from `topics` and `token count` can be fetched from `data` of that log. Now `symbol` can be fetched using ABI of ERC20 and `contract address`. Persist these transactions in a `mysql` DB.

# Setup:

-  Create DB with name `event_index` in mysql 
-  Configure dotenv
-  `npm run start`
-  Sample Get request:  `http://localhost:3000/fetchSendersDetails?sender=0xb07098db26ea326d82d9b5b34520535fdb8980b8`
-  Sample response:
```
{
    "all_txs": [
        {
            "tx_hash": "0x0012d256476d3ea8a139fbf498abd3da15aaab4359db63cea0b708a073b382f2",
            "logIndex": 138,
            "sender": "0xb07098db26ea326d82d9b5b34520535fdb8980b8",
            "receiver": "0x30146933a3a0babc74ec0b3403bec69281ba5914",
            "amount": "32794.0077",
            "token": "TEAM"
        }
    ],
    "transfer_count": 1
}
```