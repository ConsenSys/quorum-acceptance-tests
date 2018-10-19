/*
This test case covers the following scenarios:
sending private smart contract transaction from one node to the other nodes and emitting events.
The emitted events are checked and expected count of events in the participant nodes is asserted
NOTE:
We should test with high txn count for ISTANBUL to simulate events getting distributed in multiple blocks
 */

step('private smart contract from node <fromNodeNo> to node <toNodeNo> with <eventCnt> events',
    async function(fromNodeNo, toNodeNo, eventCnt) {
    const assert = require('assert');
    const Web3 = require('web3');
    const cfg = require("config");
    const logger = require('tracer').console({level:cfg.logLevel()});
    const sc = require("lib/smart_contract")(cfg, Web3, logger);
    var res = await sc.deployContractAndCheckReceiptsForEventLog(true, fromNodeNo, eventCnt, toNodeNo);
    assert.equal(res, true);
});
