module.exports = function(config, wobj, log) {

    this.Web3 = wobj
    this.logger = log
    this.cfg = config
    const assert = require('assert')
    const ut = require("./util1")

    this.sendPublicTransaction = async function(nodeIndex, amount) {
        logger.info("start testing in NODE"+nodeIndex + "...")
        const accts = cfg.accounts()
        const nodeName = cfg.nodes()[nodeIndex]
        const web3 = new Web3(new Web3.providers.HttpProvider(nodeName))
        const eth = web3.eth
        const fromAcct = accts[nodeIndex]
        var blockNumber = 0
        var newBlockNumber = 0
        var toAcct = ""
        var fromAcctBal = 0
        var toAcctBal = 0
        var fromAcctBalAfterTransfer = 0
        var toAcctBalAfterTransfer = 0

        for(var n=1; n <= 7; ++n) {
            if(n == nodeIndex) continue
            logger.debug("NODE"+nodeIndex + " -> " + n)
            toAcct = accts[n]
            logger.debug("send transaction from account in node"+nodeIndex+" to account in node" + n + "...")
            fromAcctBal = await eth.getBalance(fromAcct)
            toAcctBal = await eth.getBalance(toAcct)
            blockNumber = await eth.getBlockNumber()
            logger.debug("fromAcct:" + fromAcct + " fromAcctBal:" + fromAcctBal + " toAcct:" + toAcct + " toAcctBal:" + toAcctBal + " blockNumber:" + blockNumber)
            var txHash = await eth.sendTransaction({from:fromAcct,to:toAcct,value:ut.getRandomInt(amount)})
            logger.debug("txHash:" + txHash.blockHash)
            var txReciept = await eth.getTransactionReceipt(txHash.transactionHash)
            logger.debug("txReciept:"+txReciept)
            fromAcctBalAfterTransfer = await eth.getBalance(fromAcct)
            toAcctBalAfterTransfer = await eth.getBalance(toAcct)
            newBlockNumber = txReciept.blockNumber

            logger.debug("fromAcct:" + fromAcct + " fromAcctBal:" + fromAcctBalAfterTransfer + " toAcct:" + toAcct + " toAcctBal:" + toAcctBalAfterTransfer + " blockNumber:" + newBlockNumber)
            assert.notEqual(blockNumber, newBlockNumber, "block number not changed")
            assert.notEqual(txHash.blockHash, "", "txHash block hash is empty")
            assert.notEqual(fromAcctBal, fromAcctBalAfterTransfer, "from account balance not changed")
            assert.notEqual(toAcctBal, toAcctBalAfterTransfer, "to account balance not changed")

            logger.debug("send transaction from account in node"+nodeIndex+" to account in node" + n + " done")
        }
        logger.info("finished testing in NODE"+nodeIndex)
        return true
    }

    this.sendPublicTransactionInParallel = async function(){
        var promises = []
        var resArr = []
        for(var j = 1; j <= cfg.nodesToTest(); ++j){
            promises[promises.length] = new Promise( async function (res,rej) {
                try{
                    logger.debug("started for node " + j)
                    var r = await this.sendPublicTransaction(j, ut.getRandomInt(780))
                    logger.debug("finished for node " + j)
                    res(r)
                }catch (e) {
                    rej(e)
                }

            })
        }
        logger.debug("waiting for promises to be resolved...")
        var res = await Promise.all(promises)
        logger.debug("promises resolved ==> "+res)
        return res
    }

    return this;


}