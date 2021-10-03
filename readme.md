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

```
MySQL used for ACID compliance and 3rd normal form. 

Primary Key is transaction hash and log index to identify each unique transfer event

# Methodology:

Subscribe to each new block formed say n, and get all the transactions of (n-6)th block for a re-org proof indexing.

For each contract interacting transaction, fetch the logs and then for each `trasnfer` event log find the `from` which is the caller, `to` can be fetched from `topics` and `token count` can be fetched from `data` of that log. Now `symbol` can be fetched using ABI of ERC20 and `contract address`. Persist these transactions in a `mysql` DB.

