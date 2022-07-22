import { Resolver } from '@ethersproject/providers';
import { ApiPromise, WsProvider, Keyring }     from '@polkadot/api';
// import { numberToHex, u8aToString, stringToU8a, u8aToHex, hexToU8a, BN, stringToHex } from '@polkadot/util'; // Some helper functions used here
import { numberToHex, u8aToHex, BN, stringToHex, hexToU8a } from '@polkadot/util'; // Some helper functions used here
import { evmToAddress, addressToEvm } from '@polkadot/util-crypto';
// import { blake2AsHex, evmToAddress, addressToEvm } from '@polkadot/util-crypto';

import { ethers } from 'ethers';  

import IERC20_raw from './Abis/IERC20';  
import Xtokens_raw from './Abis/Xtokens';       
const XtokensAddress    = "0x0000000000000000000000000000000000000804";    
const mantissa12 = new BN("1000000000000");
const mantissa18 = new BN("1000000000000000000");
const mantissa8 = new BN("100000000");



let wallet, Xtokens, KusamaApi, KaruraApi, MoonriverApi, KintsugiApi, PhalaApi, BasiliskApi, ShidenApi;
let Rococo_RhalaApi, Rococo_BasiliskApi, Rococo_KaruraApi;
const setWallet = (_wallet=null) => { 
  if (_wallet) {
      wallet = _wallet;
      console.log("New wallet : ",wallet);
      Xtokens     =  new ethers.Contract( XtokensAddress, Xtokens_raw.abi, wallet);
  }
}
const setApi = (apiName, api) => {
  if (apiName==="Kusama") KusamaApi = api;
  else if (apiName==="Karura")          { KaruraApi          = api; apiObj["2000"] = api; }
  else if (apiName==="Moonriver")       { MoonriverApi       = api; apiObj["2023"] = api; }
  else if (apiName==="Kintsugi")        { KintsugiApi        = api; apiObj["2092"] = api; }
  else if (apiName==="Phala")           { PhalaApi           = api; apiObj["2004"] = api; }
  else if (apiName==="Basilisk")        { BasiliskApi        = api; apiObj["2090"] = api; }
  else if (apiName==="Shiden")          { ShidenApi          = api; apiObj["2007"] = api; }
  

  else if (apiName==="Rococo_Phala")    { Rococo_RhalaApi    = api; apiObj["r2004"] = api; }
  else if (apiName==="Rococo_Basilisk") { Rococo_BasiliskApi = api; apiObj["r2090"] = api; }
  else if (apiName==="Rococo_Karura")   { Rococo_KaruraApi   = api; apiObj["r2000"] = api; }
}

const apiObj = {
                "2000" : null,
                "2023" : null,
                "2092" : null,
                "2004" : null,
                "2090" : null,
                "2007" : null,
                "2090": null,
                "r2004" : null,
                "r2090" : null,
                "r2000" : null,
               }
const generalKeyWithout_0x = {
                              "KAR"  : "0080",
                              "AUSD" : "0081",
                              "KUSD" : "0081",
                              "KINT" : "000c",
                              "KBTC" : "000b",
                              "BSX"  : "00000000",
                              "PHA"  : "N/A",
                              "MOVR" : "N/A",
                              "KSM"  : "N/A",
                              "SDN"  : "N/A",
                             };
const tokenBirthChain     = {
                              "KAR"  : 2000,
                              "AUSD" : 2000,
                              "KUSD" : 2000,
                              "KINT" : 2092,
                              "KBTC" : 2092,
                              "BSX"  : 2090,
                              "PHA"  : 2004,
                              "SDN"  : 2007,
                             };                             


let polkadotInjector = null, polkadotInjectorAddress=null;
const setPolkadotInjector = (injector, injectorAddress) => { 
    polkadotInjector = injector;
    polkadotInjectorAddress = injectorAddress;
    console.log(`Setup New Polkadot Signer/Injector polkadotInjectorAddress: ${polkadotInjectorAddress} polkadotInjector: `,polkadotInjector)
}



//#region ***** Get balance for ERC20 token //*****
const getBalance = async (tokenAddress, client) => {
      const erc20 =  new ethers.Contract( tokenAddress, IERC20_raw.abi, wallet);
      const balanceWEI = await erc20.balanceOf(client);
      const balance = ethers.utils.formatUnits(balanceWEI,12);
      console.log(`Balnance of ${client} for ${tokenAddress} is: `,balance);
      return balance;
};
//#endregion

//#region ***** Check allowance for ERC20 token //*****
const checkAllowanceOfTokentoAddress = async (wallet, tokenAddress, client, spender) => {
    const erc20 =  new ethers.Contract( tokenAddress, IERC20_raw.abi, wallet);
    let allowanceWEI = await erc20.allowance(client, spender);
    const allowance = ethers.utils.formatUnits(allowanceWEI,12);
    console.log(`allowance: `,allowance);
    return allowance;
};
//#endregion

//#region *****  Approve ERC20  //*****
const approve = async (tokenAddress, spender, amountin_unitsEth="0.001") => {  
    const erc20 =  new ethers.Contract( tokenAddress, IERC20_raw.abi, wallet);

    const amountWEI =  ethers.BigNumber.from( ethers.utils.parseUnits(amountin_unitsEth,12) );
    console.log(`Client wants to transfer ${amountWEI} Tokens WEI. NEED TO APPROVE TRANSFER OF THIS TOKEN FROM CLIENT ACCOUNT TO SPENDER`);

    return new Promise (async (resolve,reject) => {
        const tx2 = await erc20.approve(spender, amountWEI );
        tx2.wait().then( async reslveMsg => {
             console.log(`tx2 fro approval is mined resolveMsg : `,reslveMsg);
        });

    })
};
//#endregion

//#region ***** Simple ERC20 Transfer //*****
const simpleERC20Transfer = async (wallet, tokenAddress, receipient, amountin_unitsEth="0.001") => {
  const erc20 =  new ethers.Contract( tokenAddress, IERC20_raw.abi, wallet);

  const amountWEI =  ethers.BigNumber.from( ethers.utils.parseUnits(amountin_unitsEth,12) );
  const tx3 = await erc20.transfer(receipient, amountWEI);
  tx3.wait().then( async reslveMsg => {
    console.log(`tx3 for transfer is mined resolveMsg : `,reslveMsg);
   });
};
//#endregion

 

//#region getAccountIdtoHex
const getAccountIdtoHex = (accountI32="") => {
  const keyring = new Keyring({ type: 'sr25519' });
  // const PHRASE = 'casual subject usage friend elder novel brick prosper order protect senior hunt';    //Alecia
  // const Alecia = keyring.addFromUri(PHRASE);

  // const hexvalue = u8aToHex(Alecia.publicKey);
  // console.log("********* *** hexvalue: ",hexvalue);  //0x92c192cbc87592da162e2e57693382c084eb6b13cc2c8aa47a7515b27b5ccc0f // 5FP8MMBmPdBCMgG5AspTHVNWXXSEoR4vgJwSrehUj1qJAKxN
  // const publicKey_u8_Alecia = hexToU8a("0x92c192cbc87592da162e2e57693382c084eb6b13cc2c8aa47a7515b27b5ccc0f");
  // const kusamaAddress = keyring.encodeAddress(publicKey_u8_Alecia, 42);
  // const publicKeyU8_Alecia = keyring.decodeAddress('5FP8MMBmPdBCMgG5AspTHVNWXXSEoR4vgJwSrehUj1qJAKxN')
  // console.log(`Alecia ${Alecia.meta.name}: has address ${Alecia.address} with publicKey [${Alecia.publicKey}]`);
  // console.log(`For hex 0x92c192cbc87592da162e2e57693382c084eb6b13cc2c8aa47a7515b27b5ccc0f publicKey is ${hexToU8a("0x92c192cbc87592da162e2e57693382c084eb6b13cc2c8aa47a7515b27b5ccc0f")} kusamaAddress: ${kusamaAddress} and again publicKey From any address e.g. Kusama [${keyring.decodeAddress('5FP8MMBmPdBCMgG5AspTHVNWXXSEoR4vgJwSrehUj1qJAKxN')}]`);

  const publicKeyU8 = keyring.decodeAddress(accountI32)
  const hexvalue = u8aToHex(publicKeyU8);
  // console.log(`getAccountIdtoHex Received accountI32: ${accountI32} publicKeyU8:${publicKeyU8} hexvalue: ${hexvalue}`);

  return hexvalue;
}
//#endregion

//#region convertEVMtoSubstrate  convertSubstratetoEVM
const convertEVMtoSubstrate = (account20="") => {
  // const bytesMsg  = `${stringToHex("evm:")}${account20.substring(2)}`;
  // const hexvalue  = blake2AsHex(bytesMsg);
  // const publicKeyU8 = hexToU8a(hexvalue);
  // const keyring = new Keyring({ type: 'sr25519' });
  // const substrate_Address = keyring.encodeAddress(publicKeyU8, 42);
  // console.log(`***** account20:${account20} bytesMsg:${bytesMsg} hexvalue:${hexvalue} publicKeyU8:${publicKeyU8} substrate_Address:${substrate_Address} same_substrate_Address: ${same_substrate_Address}`);

  //equivalent to above
  const substrate_Address = evmToAddress(account20);
  // console.log(`***** account20:${account20} substrate_Address:${substrate_Address}`);
  return substrate_Address;
}
// convertEVMtoSubstrate("0x7c0f5F59A22B657C8D9E21b44D2Dc0118fD2BE7B");

const convertSubstratetoEVM = (account32="") => {
  const u8Array = addressToEvm(account32);
  const evm_Address = u8aToHex(u8Array);
  // console.log(`***** account32:${account32} evm_Address:${evm_Address}`);
  return evm_Address;
}
// convertSubstratetoEVM("5HWdttFeYE89GQDGNRYspsJouxZ56xwm6bzKxSPtbDjwpQbb")
//#endregion


//#region getAccountFormatsforAccountI32 getAccountFormatsforAccountId20
const getAccountFormatsforAccountI32 = (accountId32="") => {
  const keyring = new Keyring({ type: 'sr25519' });
  const publicKeyU8 = keyring.decodeAddress(accountId32)
  // const hexvalue = u8aToHex(publicKeyU8);

  const substrate_Address = keyring.encodeAddress(publicKeyU8, 42);
  const kusama_Address = keyring.encodeAddress(publicKeyU8, 2);
  const karura_Address = keyring.encodeAddress(publicKeyU8, 8);
  const shiden_Address = keyring.encodeAddress(publicKeyU8, 5);
  const khala_Address = keyring.encodeAddress(publicKeyU8, 30);
  const kintsugi_Address = keyring.encodeAddress(publicKeyU8, 2092);
  const hydraDX_Address = keyring.encodeAddress(publicKeyU8, 63);
  const basilisk_Address = keyring.encodeAddress(publicKeyU8, 10041);
  const crust_Address = keyring.encodeAddress(publicKeyU8, 66);
  const zeitgeist_Address = keyring.encodeAddress(publicKeyU8, 73);
  const calamari_Address = keyring.encodeAddress(publicKeyU8, 78);
  const manta_Address = keyring.encodeAddress(publicKeyU8, 77);
  
  const evmDAddress = convertSubstratetoEVM(accountId32)
  const moonriver_Address = evmDAddress;
  const moonbeam_Address  = evmDAddress;
  // const moonriver_Address = keyring.encodeAddress(publicKeyU8, 1285);
  // const moonbeam_Address = keyring.encodeAddress(publicKeyU8, 1284);

  const result = { substrate_Address, kusama_Address, karura_Address, moonriver_Address, moonbeam_Address,  shiden_Address, khala_Address, kintsugi_Address, hydraDX_Address, basilisk_Address, crust_Address, zeitgeist_Address, calamari_Address, manta_Address, }
  // console.log(` ************>>>>>> getAccountFormatsforAccountI32 Received accountId32: ${accountId32} result: `,result);

  return result
}
// getAccountFormatsforAccountI32("5HWdttFeYE89GQDGNRYspsJouxZ56xwm6bzKxSPtbDjwpQbb")

const getAccountFormatsforAccountId20 = (accountId20="") => {
  const moonriver_Address = accountId20;
  const moonbeam_Address  = accountId20;
  const substrate_Address =convertEVMtoSubstrate(accountId20);
  
  const keyring = new Keyring({ type: 'sr25519' });
  const publicKeyU8 = keyring.decodeAddress(substrate_Address)

  const kusama_Address = keyring.encodeAddress(publicKeyU8, 2);
  const karura_Address = keyring.encodeAddress(publicKeyU8, 8);
  const shiden_Address = keyring.encodeAddress(publicKeyU8, 5);
  const khala_Address = keyring.encodeAddress(publicKeyU8, 30);
  const kintsugi_Address = keyring.encodeAddress(publicKeyU8, 2092);
  const hydraDX_Address = keyring.encodeAddress(publicKeyU8, 63);
  const basilisk_Address = keyring.encodeAddress(publicKeyU8, 63);
  const crust_Address = keyring.encodeAddress(publicKeyU8, 66);
  const zeitgeist_Address = keyring.encodeAddress(publicKeyU8, 73);
  const calamari_Address = keyring.encodeAddress(publicKeyU8, 78);
  const manta_Address = keyring.encodeAddress(publicKeyU8, 77);
  
  const result = { substrate_Address, kusama_Address, karura_Address, moonriver_Address, moonbeam_Address,  shiden_Address, khala_Address, kintsugi_Address, hydraDX_Address, basilisk_Address, crust_Address, zeitgeist_Address, calamari_Address, manta_Address, }
  // console.log(`getAccountFormatsforAccountId20 Received accountId20: ${accountId20} result: `,result);

  return result
}
getAccountFormatsforAccountId20("0x31DcE1058fC19188bea6800b8719883FF0F6ba1f");
//#endregion




//#region transfer_multiasset
const transfer_multiasset = async (assetStr, assetParachainId, destParachainId, _amount, destinationAccount) => {
  return new Promise (async (resolve, reject) => {
  
        let assetGeneralKey = `${generalKeyWithout_0x[assetStr.substring(2)]}`;

        const assetParachainHex = `0000${numberToHex(Number(assetParachainId)).substring(2)}`;
        // console.log(`Transfer_multiasset assetStr:${assetStr} assetGeneralKey:${assetGeneralKey} assetParachainId:${assetParachainId} assetParachainHex:${assetParachainHex}`);

        let assetM, mantissa, amount, parentValue = 1;
        if (assetStr.toLowerCase()==="xcpha")
        {
          assetM = [`0x00${assetParachainHex}`];    //X1
        }
        else if (assetStr.toLowerCase()==="movr")  
        {
          parentValue = 0;
          assetM = [`0x04${numberToHex(10).substring(2)}`];    
        }
        else if (assetStr.toLowerCase()==="xcksm")  
        {
          assetM = [];    
        }
        // else if (assetStr.toLowerCase()==="xckbtc" && destParachainId!==2092)
        // {
        //   //e.g. sending KBTC from Moonriver to Karura we need to also send KINT to pay for the fees
        //   // assetM = [`0x00${assetParachainHex}` ,`0x06${assetGeneralKey_KINT}`];   
        //   //STOP: IMPOSSIBLE WE NEED A NEW FUNCTION FOR THE PRECOMPILE TO SUPPORT xTokens.transferMultiassets
        //   //so that we can send along KINT and define this as the token to pay fees 
        // }
        else
        {
          assetM = [`0x00${assetParachainHex}` ,`0x06${assetGeneralKey}`];   //X2
        }
        const assetMultilocation =[ parentValue, assetM];
        console.log("Transfer_multiasset assetMultilocation: ",assetMultilocation);

        //amount
        assetStr.toLowerCase()==="xckbtc"? mantissa = mantissa8   : mantissa = mantissa12;

        if ( assetStr.toLowerCase()==="movr" ) amount = (ethers.utils.parseUnits(_amount, 18)).toString();
        else  amount = (new BN( Number(_amount) * mantissa)).toString();


        //multilocation
        const hexvalue = getAccountIdtoHex(destinationAccount)
        const nakedhexvalue = hexvalue.substring(2);
        const destParachainHex = `0000${numberToHex(Number(destParachainId)).substring(2)}`;

        const multilocation = [`0x00${destParachainHex}`,`0x01${nakedhexvalue}00`];
        const destination = [1,multilocation];
        console.log(`Transfer_multiasset amount: ${amount} nakedhexvalue: ${nakedhexvalue} Multilocation: `,multilocation,` should be 0x0160c4d758184d11761943be32f71ae877974e0fa4cad523e1c3ba6c5ed340545c00 for qVA946xk9bGQ8A4m4EP3q1A1LJwvyi3QBzTRsAr68VvqeEo   destination: `,destination);

        //fees
        const weight = 4000000000;
        
        const tx4 = await Xtokens.transfer_multiasset(assetMultilocation, amount, destination , weight);
        tx4.wait().then( async reslveMsg => {
          // console.log(`tx4 for transfering ${assetStr}  from Moonriver to  ${destParachainId} is mined resolveMsg : `,reslveMsg);
          // tx4 for transfering xcKAR to KAR is mined resolveMsg :  {to: '0x0000000000000000000000000000000000000804', from: '0x8731732996d815E34DA3eda6f13277a919b3d0d8', contractAddress: null, transactionIndex: 0, gasUsed: BigNumber,
          // blockNumber: 2157608, blockHash: "0x0d613dd91986ed1fd11ad7d5dc0d709ad8f2a65f3f6b348324482c04324a651c"  
          // transactionHash: "0x85d6db8e707d8c102e02336db2bb396133be56913fcad63947b6c00f59e26c5b" …}
          // console.log(`TX4===> transactionHash: ${reslveMsg.transactionHash} from: ${reslveMsg.from} to: ${reslveMsg.to} gasUsed: ${reslveMsg.gasUsed} blockNumber: ${reslveMsg.blockNumber}`);

          const txSendKSMMsg = 
          [
            `Moonriver Transaction hash: ${reslveMsg.transactionHash}`,
            `Finalised at Block Number: ${reslveMsg.blockNumber}`,
            `Tranferred From: ${reslveMsg.from} Amount: ${_amount} To: ${reslveMsg.to} gasUsed: ${reslveMsg.gasUsed}`,
          ];  
          resolve(txSendKSMMsg);
        });
  })
        
}
//#endregion 
      


//#region transfer_xcKSMtoKSM
const transfer_xcKSMtoKSM = async (_amount, destinationRelayAccount,  destParachainId=null) => {
  return new Promise (async (resolve, reject) => {

      //amount
      const amount = (new BN(Number(_amount) * mantissa12)).toString();
      
      let multilocation;
      const hexvalue = getAccountIdtoHex(destinationRelayAccount)
      const nakedhexvalue = hexvalue.substring(2);
      
      //Moonriver xcTokens Precompiles Addresses For KSM
      const relayTokenPrecompileAddress = "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080";  
      multilocation = `0x01${nakedhexvalue}00`;

      //fees
      const weight = 4000000000;
      
      const destination = [1,[multilocation]];

      const tx4 = await Xtokens.transfer(relayTokenPrecompileAddress, amount, destination , weight);
      tx4.wait().then( async reslveMsg => {
          // console.log(`tx4 for transfering xcKSM to KSM is mined resolveMsg : `,reslveMsg);
          // console.log(`TX4===> transactionHash: ${reslveMsg.transactionHash} from: ${reslveMsg.from} to: ${reslveMsg.to} gasUsed: ${reslveMsg.gasUsed} blockNumber: ${reslveMsg.blockNumber}`);
          const txSendKSMMsg = 
          [
            `Moonriver Transaction hash: ${reslveMsg.transactionHash}`,
            `Finalised at Block Number: ${reslveMsg.blockNumber}`,
            `Tranferred From: ${reslveMsg.from} Amount: ${_amount} To: ${reslveMsg.to} gasUsed: ${reslveMsg.gasUsed}`,
          ];  
          resolve(txSendKSMMsg);
      });

  })
}
//#endregion




//#region ***** Transfer Multiple Assets from Parachain to Parachain //*****    
const transfer_MultipleAssets_FromParachainToParachain = async (_token="KBTC", feesToken="KINT", originParachain=2000, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {
  return new Promise (async (resolve, reject) => {

        if (!polkadotInjector || !polkadotInjectorAddress) {
          console.log(`transfer_MultipleAssets_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
          resolve("Polkadot Extension Error Please Refresh Dapp");
          return;
        }

        let api = apiObj[`${originParachain}`];
        const general_key = `0x${generalKeyWithout_0x[_token]}`;
        const general_FeesTokenkey = `0x${generalKeyWithout_0x[feesToken]}`;


        let beneficiary, mantissa; 
        if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
        {
          beneficiary =  { accountKey20: { network: "Any",  key: EVMaccount } };
          general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
        }
        // else
        // {
        //   const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  
        //   beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
        //   general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
        // }


        const txMultipleAssetsParachainToParachain = await api.tx.xTokens
        .transferMultiassets(
            { V1: 
                [
                      { 
                          id:  { 
                                Concrete: { 
                                            parents: 1, 
                                            interior: 
                                                      {
                                                        x2: [
                                                              { 
                                                                  Parachain: tokenBirthChain[_token],
                                                              },
                                                              {
                                                                  Generalkey: general_key  
                                                              }
                                                            ]
                                                      }
                                            } 
                                },
                          fun: { Fungible: (new BN(amount * mantissa)) }
                      },
                      { 
                          id:  { 
                                Concrete: { 
                                            parents: 1, 
                                            interior: 
                                                      {
                                                        x2: [
                                                              { 
                                                                  Parachain: tokenBirthChain[feesToken],
                                                              },
                                                              {
                                                                  Generalkey: general_FeesTokenkey  
                                                              }
                                                            ]
                                                      }
                                            } 
                                },
                          fun: { Fungible: (new BN(4000000000)) }
                      }
                ]
            },
            1,
            { V1: {
                            parents: 1,
                            interior: {
                                x2: [
                                      { 
                                        Parachain: parachain,
                                      },
                                      beneficiary
                                    ]
                            }
                    } 
            },
            (new BN(4000000000) )
        )      
        .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
            // console.log(`Current status: `,status,` Current status is ${status.type}`);
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            // });

            let errorInfo;
            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorInfo = `${section}.${name}`;
                console.log(`txMultipleAssetsParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                //Exampleof Error message:  txAssetParachainToParachain dispatchError1 xTokens.NotCrossChainTransfer: Not cross-chain transfer.
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
                console.log(`txMultipleAssetsParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
              }
            }
            // else console.log(`txMultipleAssetsParachainToParachain ***** NO DISAPTCHEERROR *****: `);

            if (status.isFinalized) {
              let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

              // Loop through all events
              events.forEach(async ({ phase, event: { data, method, section } }) => {
                  const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                  // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                  if (method==="ExtrinsicSuccess") 
                  {
                    // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                    ExtrinsicResult = "Succeeded"; 
                    const extrinsicBlockHash = status.asFinalized;
                    const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                    signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                      if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                    });
  
                    const txSendMsg = 
                                        [
                                          `Extrinsic hash: ${extrinsicHash}`,
                                          `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                          `Treasury Fees: ${treasuryFees} Total Origin Fees: ${originFees}`,
                                          `Xcmp Message Sent: ${XcmpMessageSent}`,
                                        ];  
                    resolve(txSendMsg);
                  }
                  else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                  else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                  else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                  else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                  // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
              });
              
              txMultipleAssetsParachainToParachain();
            }
            
        });
           
    })

}
//#endregion 





const tokenToId = (token) => {
  console.log('tokenToId', token);
  switch (token) {
    case "BSX":
      return 0;
    case "KUSD":
      return 1;
    case "KSM":
      return 2;
  }
}

//#region ***** Transfer Asset from Parachain to Parachain //*****   
const transfer_Asset_FromParachainToParachain = async (_token="KUSD", originParachain=2000, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {
   return new Promise (async (resolve, reject) => {

            if (!polkadotInjector || !polkadotInjectorAddress) {
              console.log(`transfer_Currency_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
              resolve("Polkadot Extension Error Please Refresh Dapp");
              return;
            }

            let api = apiObj[`${originParachain}`];
            const general_key = `0x${generalKeyWithout_0x[_token]}`;

            let beneficiary, mantissa; 
            if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
            {
              beneficiary =  { accountKey20: { network: "Any",  key: EVMaccount } };
              general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
            }
            else
            {
              const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  
              beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
              general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
            }

            const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  


            let multiAssetLocation;
            if (_token.toLowerCase()==="ksm") multiAssetLocation = "Here";
            else
            {
              multiAssetLocation =  {
                                      x2: [
                                            { 
                                                Parachain: tokenBirthChain[_token],
                                            },
                                            {
                                                Generalkey: general_key  
                                            }
                                          ]
                                    };
            }



            const txAssetParachainToParachain = await api.tx.xTokens
              .transfer(
                originParachain === 2000
                  ? ({
                    Token: _token
                  })
                  : tokenToId(_token),
                new BN(amount * mantissa12),
                {
                  V1: {
                    parents: 1,
                    interior: {
                      X2: [
                        {
                          Parachain: parachain
                        },
                        {
                          AccountId32: {
                            network: "Any",
                            id: accountId32tohexvalue
                          }
                        }
                      ]
                    }
                  }
                },
                new BN(10000000000)
              )
            // const txAssetParachainToParachain = await api.tx.xTokens
            // .transferMultiasset(
            //     { V1: 
            //               { 
            //                   id:  { 
            //                         Concrete: { 
            //                                     parents: 1, 
            //                                     interior: multiAssetLocation
            //                                   } 
            //                         },
            //                   fun: { Fungible: (new BN(amount * mantissa)) }
            //               }
            //     },
            //     { V1: {
            //                     parents: 1,
            //                     interior: {
            //                         x2: [
            //                               { 
            //                                 Parachain: parachain,
            //                               },
            //                               beneficiary
            //                             ]
            //                     }
            //             } 
            //     },
            //     (new BN(1000000000) )
            // )      
            .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
                // console.log(`Current status: `,status,` Current status is ${status.type}`);
                let errorInfo;
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    // for module errors, we have the section indexed, lookup
                    const decoded = api.registry.findMetaError(dispatchError.asModule);
                    const { docs, name, section } = decoded;
                    errorInfo = `${section}.${name}`;
                    console.log(`txAssetParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                    //Exampleof Error message:  txAssetParachainToParachain dispatchError1 xTokens.NotCrossChainTransfer: Not cross-chain transfer.
                  } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    errorInfo = dispatchError.toString();
                    console.log(`txAssetParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
                  }
                }
                // else console.log(`txAssetParachainToParachain ***** NO DISAPTCHEERROR *****: `);

                if (status.isFinalized) {
                  let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

                  // Loop through all events
                  events.forEach(async ({ phase, event: { data, method, section } }) => {
                      const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                      // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                      if (method==="ExtrinsicSuccess") 
                      {
                        // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                        ExtrinsicResult = "Succeeded"; 
                        const extrinsicBlockHash = status.asFinalized;
                        const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                        signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                          if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                        });
      
                        const txSendMsg = 
                                            [
                                              `Extrinsic hash: ${extrinsicHash}`,
                                              `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                              `Treasury Fees: ${treasuryFees} `,
                                              `Xcmp Message Sent: ${XcmpMessageSent}`,
                                            ];  
                        resolve(txSendMsg);
                      }
                      else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                      else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                      else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                      // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                      // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                  });
                  
                  txAssetParachainToParachain();
                }
                
            });
                
    })

}
//#endregion 


//#region ***** Transfer Currency from Parachain to Parachain //*****   0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d is Pablo Moon Account
const transfer_Currency_FromParachainToParachain = async (currency, originChain=2000, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {
  return new Promise (async (resolve, reject) => {
  
        if (!polkadotInjector || !polkadotInjectorAddress) {
          console.log(`transfer_Currency_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
          resolve("Polkadot Extension Error Please Refresh Dapp");
          return;
        }
        
        // const api = apiObj[`${originChain}`];
        const api = KaruraApi;

        // const now = await api.query.timestamp.now();   // Retrieve the last timestamp
        // const { nonce, data: balance } = await api.query.system.account(polkadotInjectorAddress);   // Retrieve the account balance & nonce via the system module
        // console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);


        let beneficiary, mantissa; 
        if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
        {
          beneficiary =  { accountKey20: { network: "Any",  key: EVMaccount } };
        }
        else
        {
          const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  
          beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
        }


        const txCurrencyParachainToParachain = await api.tx.xTokens
        .transfer(
            { Token: `${currency.toLowerCase()}` },
            (new BN(amount * mantissa12)),
            { V1: {
                            parents: 1,
                            interior: {
                                x2: [
                                      { 
                                        Parachain: parachain,
                                      },
                                      beneficiary
                                    ]
                            }
                    } 
            },
            (new BN(1000000000) )
        )         
        .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
            // console.log(`Current status: `,status,` Current status is ${status.type}`);
            let errorInfo;
            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorInfo = `${section}.${name}`;
                console.log(`txCurrencyParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
                console.log(`txCurrencyParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
              }
            }
            // else console.log(`txCurrencyParachainToParachain ***** NO DISAPTCHEERROR *****: `);

            if (status.isFinalized) {
              // let txResult="", extrinsicBlockHash = status.asFinalized, extrinsicIndexinBlock;
              let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

              // Loop through all events
              events.forEach(async ({ phase, event: { data, method, section } }) => {
                  const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                  // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                  
                  if (method==="ExtrinsicSuccess") 
                  {
                    // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                    ExtrinsicResult = "Succeeded"; 
                    const extrinsicBlockHash = status.asFinalized;
                    const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                    signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                      if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                    });
  
                    const txSendMsg = 
                                        [
                                          `Karura Extrinsic hash: ${extrinsicHash}`,
                                          `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                          `Treasury Fees: ${treasuryFees} Total Origin Fees: ${originFees}`,
                                          `Xcmp Message Sent: ${XcmpMessageSent}`
                                        ];  
                    resolve(txSendMsg);
                  }
                  else if (method==="ExtrinsicFailed") resolve(["Extrisnic Failed"]);
                  else if (method==="Withdrawn"  && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;    //txResult +=` Withdrawn ${JSON.parse(data[0]).token} from ${data[1]} KSM:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                  else if (method==="Deposit" && section==="treasury")  treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;    
                  else if (method==="XcmpMessageSent" && section==="xcmpQueue")   XcmpMessageSent = `${data[0]}`;
              });

              txCurrencyParachainToParachain();
            }
            
        });
       
  })

}
//#endregion 


//#region ***** Transfer from Relay to Parachain //*****   0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d is Pablo Moon Account
const transferFromRelayToParachain = async (apiRelay, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {
  return new Promise (async (resolve, reject) => {

      if (!polkadotInjector || !polkadotInjectorAddress) {
        console.log(`transferFromRelayToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
        resolve("Polkadot Extension Error Please Refresh Dapp");
        return;
      }
        console.log('EVM ACCOUNT', EVMaccount)
        const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  
        // const beneficiary = { 
        //                 V1: {
        //                       parents: 0, 
        //                       interior: { 
        //                                   X1: { 
        //                                         AccountId32 : { 
        //                                                         network: "Any", 
        //                                                         id: accountId32tohexvalue 
        //                                                       } 
        //                                       } 
        //                                 } 
        //                     } 
        //               };

      const txRelaytoParachain = await apiRelay.tx.xcmPallet
        .execute({
          V2: [
            {
              TransferReserveAsset: {
                assets: [
                  {
                    id: {
                      Concrete: {
                        parents: 0,
                        interior: "Here"
                      }
                    },
                    fun: {
                      Fungible: 1000000000
                    }
                  }
                ],
                dest: {
                  parents: 0,
                  interior: {
                    X1: {
                      Parachain: parachain
                    }
                  }
                },
                xcm: [
                  {
                    BuyExecution: {
                      fees: {
                        id: {
                          Concrete: {
                            parents: 1,
                            interior: "Here"
                          }
                        },
                        fun: {
                          Fungible: 1000000000
                        }
                      },
                      weightLimit: {
                        Limited: 1000000000
                      }
                    }
                  },
                  {
                    DepositAsset: {
                      assets: {
                        Wild: "All"
                      },
                      maxAssets: 1,
                      beneficiary: {
                        parents: 0,
                        interior: {
                          X1: {
                            AccountId32: {
                              network: "Any",
                              id: accountId32tohexvalue
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          ]
        }, (new BN(1000000000)))

      // const txRelaytoParachain = await apiRelay.tx.xcmPallet
      // .limitedReserveTransferAssets(
      //     { V1: {parents: 0, interior: { X1: { Parachain: parachain } } } },
      //     beneficiary,
      //     { V1: [ 
      //               { 
      //                   id:  { Concrete: { parents: 0, interior: "Here"} },
      //                   fun: { Fungible: (new BN(amount * mantissa12)) }
      //               }
      //           ] 
      //     },
      //   0, 
      //   {Limited: new BN(1000000000)}

      // )         
      .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
          // console.log(`Current status: `,status,` Current status is ${status.type}`);
          let errorInfo;
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = apiRelay.registry.findMetaError(dispatchError.asModule);
              const { docs, name, section } = decoded;
              errorInfo = `${section}.${name}`;
              console.log(`txRelaytoParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              errorInfo = dispatchError.toString();
              console.log(`txRelaytoParachain dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
            }
          }
          //else console.log(`txRelaytoParachain ***** NO DISAPTCHEERROR *****: `);

          if (status.isFinalized) {
            let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees;
            // Loop through all events
            events.forEach(async ({ phase, event: { data, method, section } }) => {
                const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);

                if (method==="ExtrinsicSuccess") {
                  // txResult +=` Extrisnic Succeeded with Fees: ${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0].weight}`),12)} `;
                  ExtrinsicResult = "Succeeded"; 
                  const extrinsicBlockHash = status.asFinalized;
                  const signedBlock = await apiRelay.rpc.chain.getBlock(extrinsicBlockHash);
                  signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                    if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                  });

                  const txSendKSMMsg = 
                  [
                    `Kusama Extrinsic hash: ${extrinsicHash}`,
                    `Finalised at Block Hash: ${extrinsicBlockHash}`,
                    `Tranferred Amount: ${tranferredAmount} Treasury Fees: ${treasuryFees} Total Origin Fees: ${originFees}`,
                  ];  
                  resolve(txSendKSMMsg);
                }
                else if (method==="ExtrinsicFailed") resolve(["Extrisnic Failed"]);
                else if (method==="Withdraw") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[1]}`),12)}`;   
                else if (method==="Transfer") tranferredAmount = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;  
                else if (method==="Deposit" && section==="treasury")   treasuryFees =`${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;
            });

            txRelaytoParachain();
          }
          
      });
      // console.log(`Submitted xcmPallet transaction with txRelaytoParachain`);    
  })

}
//#endregion 


//#region ***** Transfer from Parachain to Relay //*****   
const transferFromParachainToRelay = async (originChain, accntId32, amount="1") => {
  return new Promise (async (resolve, reject) => {
  
      if (!polkadotInjector || !polkadotInjectorAddress) {
        console.log(`transferFromParachainToRelay polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
        resolve("Polkadot Extension Error Please Refresh Dapp");
        return;
      }

      let api;
      if (originChain==="Karura") api = KaruraApi;
      if (originChain==="Basilisk") api = BasiliskApi;

      // const now = await api.query.timestamp.now();    
      // const { nonce, data: balance } = await api.query.system.account(polkadotInjectorAddress);   // Retrieve the account balance & nonce via the system module
      // const {free: free1 , reserved: reserved1, frozen: frozen1} = await api.query.tokens.accounts(polkadotInjectorAddress, {Token: token}); 
      // console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);

      const accountId32tohexvalue = getAccountIdtoHex(accntId32);  

      const txAssetParachainToRelay = await api.tx.xTokens
      .transfer(
        originChain === 'Karura'
          ? {
            Token: "KSM",
          }
          : tokenToId("KSM"),
        (new BN(amount * mantissa12)),
        {
          V1: {
            parents: 1,
            interior: {
              X1: {
                AccountId32: {
                  network: "Any",
                  id: accountId32tohexvalue
                }
              }
            }
          }
        },
        (new BN(500000000) ),
      )     
      .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
          // console.log(`Current status: `,status,` Current status is ${status.type}`);
          // events.forEach(({ phase, event: { data, method, section } }) => {
          //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
          // });   

          // const _token = "KSM";

          let errorInfo;
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const { docs, name, section } = decoded;
              errorInfo = `${section}.${name}`;
              console.log(`transferFromParachainToRelay dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              errorInfo = dispatchError.toString();
              console.log(`transferFromParachainToRelay dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
            }
          }
          // else console.log(`transferFromParachainToRelay ***** NO DISAPTCHEERROR *****: `);

          if (status.isFinalized) {
            let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees;

            // Loop through all events
            events.forEach(async ({ phase, event: { data, method, section } }) => {
                const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);

                if (method==="ExtrinsicSuccess") 
                {
                  // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                  ExtrinsicResult = "Succeeded"; 
                  const extrinsicBlockHash = status.asFinalized;
                  const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                  signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                    if (index===Number(extrinsicIndexinBlock))  extrinsicHash = `${hash.toString()}`
                  });

                  const txMsg = 
                              [
                               `Transfer Extrinsic hash: ${extrinsicHash} .`,
                               `Finalised at Block Hash: ${extrinsicBlockHash} .`,
                               `TranferredAmount: ${tranferredAmount}  Treasury Fees: ${treasuryFees}`,
                              ];
                  resolve(txMsg);
                }
                else if (method==="ExtrinsicFailed")resolve(["Extrisnic Failed"]);
                else if (method==="Deposit" && section==="treasury")    treasuryFees =`${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;
                else if (method==="Withdrawn"  && section==="tokens") tranferredAmount =`${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
            });

            txAssetParachainToRelay();
          }
          
      });
         
  })

}
//#endregion 


//#region ***** Transfer MOVR from Parachain to Parachain //*****   
const transfer_MOVR_FromParachainToParachain = async (originChain, parachainID, EVMaccount, amount="1") => {
  return new Promise (async (resolve, reject) => {

  
        if (!polkadotInjector || !polkadotInjectorAddress) {
          console.log(`transfer_MOVR_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
          resolve("Polkadot Extension Error Please Refresh Dapp");
          return;
        }

        let api;
        if (originChain==="Karura") api = KaruraApi;
        else if (originChain==="Phala") api = PhalaApi;


        const txAssetMOVRParachainToParachain = await api.tx.xTokens
        .transferMultiasset(
            { V1: 
                      { 
                          id:  { 
                                Concrete: { 
                                              parents: 1, 
                                              interior:  
                                                        {
                                                          x2: [
                                                                { 
                                                                    Parachain: 2023,
                                                                },
                                                                {
                                                                    PalletInstance: 10  
                                                                }
                                                              ]
                                                        }                                        
                                            } 
                                },
                          fun: { Fungible: (ethers.utils.parseUnits(amount, 18)).toString() }
                      }
            },
            { V1: {
                            parents: new BN(1),
                            interior: {
                                x2: [
                                      { 
                                        Parachain: parachainID,
                                      },
                                      {
                                        accountKey20: {
                                                        network: "Any",
                                                        key: EVMaccount
                                                      }
                                      }
                                    ]
                            }
                    } 
            },
            (new BN(1000000000) )
        )      
        .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
            // console.log(`Current status: `,status,` Current status is ${status.type}`);
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            // });   
            // const _token = "MOVR";

            let errorInfo;
            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorInfo = `${section}.${name}`;
                console.log(`txAssetMOVRParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
                console.log(`txAssetMOVRParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
              }
            }
            // else console.log(`txAssetMOVRParachainToParachain ***** NO DISAPTCHEERROR *****: `);

            if (status.isFinalized) {
              // let txResult="", extrinsicBlockHash = status.asFinalized, extrinsicIndexinBlock;
              let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

              // Loop through all events
              events.forEach(async ({ phase, event: { data, method, section } }) => {
                  const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                  // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                  if (method==="ExtrinsicSuccess") 
                  {
                    // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                    ExtrinsicResult = "Succeeded"; 
                    const extrinsicBlockHash = status.asFinalized;
                    const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                    signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                      if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                    });
  
                    const txSendMsg = 
                                        [
                                          `Extrinsic hash: ${extrinsicHash}`,
                                          `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                          `Treasury Fees: ${treasuryFees} Total Origin Fees: ${originFees}`,
                                          `Xcmp Message Sent: ${XcmpMessageSent}`,
                                        ];  
                    resolve(txSendMsg);
                  }
                  else if (method==="ExtrinsicFailed") resolve(["Extrinsic Failed"]);
                  else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                  else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                  else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                  // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
              });
              
              txAssetMOVRParachainToParachain();
            }
            
        });

  })

}
//#endregion 



//#region ***** Transfer from Basilisk to Parachain //*****   
const transferFromBasiliskToParachain = async (token, originParachain, parachain, account, amount="1") => {
  return new Promise (async (resolve, reject) => {
  
      if (!polkadotInjector || !polkadotInjectorAddress) {
        console.log(`transferFromBasiliskToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
        resolve("Polkadot Extension Error Please Refresh Dapp");
        return;
      }

      let api = apiObj[`${originParachain}`];
      
      const txAssetBasiliskToParachain = await api.tx.xTransfer
      .transfer(
          tokenToId(token),
          new BN(amount ** mantissa12),
          {
            V1: {
              parents: 1,
              interior: {
                X2: [
                  {
                    Parachain: parachain
                  },
                  {
                    AccountId32: {
                      network: "Any",
                      id: getAccountIdtoHex(account),
                    }
                  }
                ]
              }
            }
          }
          (new BN(1500000000) )
      )     
      .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
          // console.log(`Current status: `,status,` Current status is ${status.type}`);
          // events.forEach(({ phase, event: { data, method, section } }) => {
          //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
          // });  
          
          // const _token = "PHA";

          let errorInfo;
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const { docs, name, section } = decoded;
              errorInfo = `${section}.${name}`;
              console.log(`txAssetPhalaToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              errorInfo = dispatchError.toString();
              console.log(`txAssetPhalaToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
            }
          }
          else console.log(`txAssetPhalaToParachain ***** NO DISAPTCHEERROR *****: `);

          if (status.isFinalized) {
            let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

            // Loop through all events
            events.forEach(async ({ phase, event: { data, method, section } }) => {
                const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                if (method==="ExtrinsicSuccess") 
                {
                  // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                  ExtrinsicResult = "Succeeded"; 
                  const extrinsicBlockHash = status.asFinalized;
                  const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                  signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                    if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                  });

                  const txSendMsg = 
                                      [
                                        `Extrinsic hash: ${extrinsicHash}`,
                                        `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                        `Treasury Fees: ${treasuryFees} `,
                                        `Xcmp Message Sent: ${XcmpMessageSent}`,
                                      ];  
                  resolve(txSendMsg);
                }
                else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
            });
            
            txAssetBasiliskToParachain();
          }
          
      });
          
    })

}
//#endregion 


//#region ***** Transfer from Phala to Relay //*****   
const transferFromPhalaToRelay = async (accntId32, amount="1") => {
  return new Promise (async (resolve, reject) => {
  
      if (!polkadotInjector || !polkadotInjectorAddress) {
        console.log(`transferFromParachainToRelay polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
        resolve("Polkadot Extension Error Please Refresh Dapp");
        return;
      }

      const api = PhalaApi;
      
      // const now = await api.query.timestamp.now();    
      // const { nonce, data: balance } = await api.query.system.account(polkadotInjectorAddress);   // Retrieve the account balance & nonce via the system module
      // console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);

      const accountId32tohexvalue = getAccountIdtoHex(accntId32);  

      const txAssetPhalaToRelay = await api.tx.xTransfer
      .transfer(
          { 
              id:  { 
                      Concrete: { 
                                  parents: 1, 
                                  interior: "Here"
                                } 
                    },
              fun: { Fungible: (new BN(amount * mantissa12)) }
          },
          {
              parents: 1,
              interior: {
                          x1: {
                                AccountId32: {
                                                network: "Any",
                                                id: accountId32tohexvalue
                                              }
                              }
                        }
          },
          (new BN(1000000000) )
      )     
      .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
          // console.log(`Current status: `,status,` Current status is ${status.type}`);
          // events.forEach(({ phase, event: { data, method, section } }) => {
          //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
          // });  
          
          // const _token = "KSM";

          let errorInfo;
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              const { docs, name, section } = decoded;
              errorInfo = `${section}.${name}`;
              console.log(`transferFromPhalaToRelay dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              errorInfo = dispatchError.toString();
              console.log(`transferFromPhalaToRelay dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
            }
          }
          // else console.log(`transferFromPhalaToRelay ***** NO DISAPTCHEERROR *****: `);

          if (status.isFinalized) {
            let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees;

            // Loop through all events
            events.forEach(async ({ phase, event: { data, method, section } }) => {
                const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);

                if (method==="ExtrinsicSuccess") 
                {
                  // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                  ExtrinsicResult = "Succeeded"; 
                  const extrinsicBlockHash = status.asFinalized;
                  const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                  signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                    if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                  });

                  const txSendKSMMsg = 
                                      [
                                        `Phala Extrinsic hash: ${extrinsicHash}`,
                                        `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                        `Treasury Fees: ${treasuryFees} Total Origin Fees: ${originFees}`,
                                      ];  
                  resolve(txSendKSMMsg);
                }
                else if (method==="ExtrinsicFailed") resolve(["Extrisnic Failed"]);
                else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`; //txResult +=` Deposit to treasury ${data[0]} KSM:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;
                // else if (method==="Withdrawn" && section==="currencies")  txResult +=` Withdrawn ${JSON.parse(data[0]).token} from ${data[1]} ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                // else if (method==="XcmpMessageSent" && section==="xcmpQueue")   txResult +=` XcmpMessageSent ${data[0]}`;
            });

            txAssetPhalaToRelay();
          }
          
      });
      
  })

}
//#endregion 


//#region ***** Transfer from Relay to Relay //*****
const tranferFromRelayToRelay = async (apiRelay, recipient='', _amount="1") => {

      if (!polkadotInjector || !polkadotInjectorAddress) {
        console.log(`tranferFromRelayToRelay polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`)
      }

      const amount = (new BN(_amount)).mul(mantissa12);
      
      apiRelay.tx.balances
      .transfer(recipient, amount)
      .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, ({ status, events, dispatchError }) => {
        
        if (dispatchError) {
          if (dispatchError.isModule) {
            
            const decoded = apiRelay.registry.findMetaError(dispatchError.asModule);
            const { docs, name, section } = decoded;

            console.log(`${section}.${name}: ${docs.join(' ')}`);
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.log(dispatchError.toString());
          }
        }
      });

}
//#endregion 












































//#region ***** ROCOCO_BASILISK  //*****   

//#region ***** Transfer Asset from Parachain to Parachain //*****    
//BSX FROM BASILISK TO KARURA or PHALA
//BSX FROM KARURA TO BASILISK 
const rococo_transfer_Asset_FromParachainToParachain = async (_token="BSX", originParachain=2000, parachain=1000, account, amount="1") => {
  return new Promise (async (resolve, reject) => {

           if (!polkadotInjector || !polkadotInjectorAddress) {
             console.log(`transfer_Currency_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
             resolve("Polkadot Extension Error Please Refresh Dapp");
             return;
           }

           let api = apiObj[`${originParachain}`];
           const general_key = `0x${generalKeyWithout_0x[_token]}`;

           let beneficiary, mantissa; 
           if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
           {
             beneficiary =  { accountKey20: { network: "Any",  key: account } };
             general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
           }
           else
           {
             const accountId32tohexvalue = getAccountIdtoHex(account);  
             beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
             general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
           }

           const accountId32tohexvalue = getAccountIdtoHex(account);  


           let multiAssetLocation;
           if (_token.toLowerCase()==="ksm") multiAssetLocation = "Here";
           else
           {
             multiAssetLocation =  {
                                     x2: [
                                           { 
                                               Parachain: tokenBirthChain[_token],
                                           },
                                           {
                                               Generalkey: general_key  
                                           }
                                         ]
                                   };
           }


           const txAssetParachainToParachain = await api.tx.xTokens
            .transfer(
              originParachain === 2000
                ? {
                  Token: _token
                }
                : (
                  _token 
                ),
              new BN(amount * mantissa12),
              {
                V1: {
                  parents: 1,
                  interior: {
                    X2: [
                      {
                        Parachain: parachain
                      },
                      {
                        AccountId32: {
                          network: "Any",
                          id: accountId32tohexvalue
                        }
                      }
                    ]
                  }
                }
              },
              new BN(10000000000)
            )
          //  const txAssetParachainToParachain = await api.tx.xTokens
          //  .transferMultiasset(
          //      { V1: 
          //                { 
          //                    id:  { 
          //                          Concrete: { 
          //                                      parents: 1, 
          //                                      interior: multiAssetLocation
          //                                    } 
          //                          },
          //                    fun: { Fungible: (new BN(amount * mantissa)) }
          //                }
          //      },
          //      { V1: {
          //                      parents: 1,
          //                      interior: {
          //                          x2: [
          //                                { 
          //                                  Parachain: parachain,
          //                                },
          //                                beneficiary
          //                              ]
          //                      }
          //              } 
          //      },
          //      (new BN(1000000000) )
          //  )      
           .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
               // console.log(`Current status: `,status,` Current status is ${status.type}`);
               let errorInfo;
               if (dispatchError) {
                 if (dispatchError.isModule) {
                   // for module errors, we have the section indexed, lookup
                   const decoded = api.registry.findMetaError(dispatchError.asModule);
                   const { docs, name, section } = decoded;
                   errorInfo = `${section}.${name}`;
                   console.log(`txAssetParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                   //Exampleof Error message:  txAssetParachainToParachain dispatchError1 xTokens.NotCrossChainTransfer: Not cross-chain transfer.
                 } else {
                   // Other, CannotLookup, BadOrigin, no extra info
                   errorInfo = dispatchError.toString();
                   console.log(`txAssetParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
                 }
               }
               // else console.log(`txAssetParachainToParachain ***** NO DISAPTCHEERROR *****: `);

               if (status.isFinalized) {
                 let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

                 // Loop through all events
                 events.forEach(async ({ phase, event: { data, method, section } }) => {
                     const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                     // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                     if (method==="ExtrinsicSuccess") 
                     {
                       // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                       ExtrinsicResult = "Succeeded"; 
                       const extrinsicBlockHash = status.asFinalized;
                       const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                       signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                         if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                       });
     
                       const txSendMsg = 
                                           [
                                             `Extrinsic hash: ${extrinsicHash}`,
                                             `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                             `Xcmp Message Sent: ${XcmpMessageSent}`,
                                           ];  
                       resolve(txSendMsg);
                     }
                     else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                     else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                     //  else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                     // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                     // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                 });
                 
                 txAssetParachainToParachain();
               }
               
           });
               
   })

}
//#endregion 


//#region ***** Alterantive Transfer Currency from RococoBasilisk to Parachain //*****   
//BSX FROM BASILISK TO KARURA or PHALA
const  rococo_transfer_currency  = async (currency, parachain, account, amount="1") => {
  return new Promise (async (resolve, reject) => {
  
        if (!polkadotInjector || !polkadotInjectorAddress) {
          console.log(`rococo_transfer_currency polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
          resolve("Polkadot Extension Error Please Refresh Dapp");
          return;
        }

        const api = Rococo_BasiliskApi;

        let currencyId;
        if (currency==="BSX") currencyId=0;
        else if (currency==="PHA") currencyId=1;

        
        let beneficiary, mantissa; 
        if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
        {
          beneficiary =  { accountKey20: { network: "Any",  key: account } };
          mantissa = mantissa18;
        }
        else
        {
          const accountId32tohexvalue = getAccountIdtoHex(account);  
          beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
          mantissa = mantissa12;
        }


        const txCurrencyBasiliskToParachain = await api.tx.xTokens
        .transfer(
            currencyId, 
            (new BN(amount * mantissa)),
            { V1: {
                    parents: 1,
                    interior: {
                                x2: [
                                      { 
                                        Parachain: parachain,
                                      },
                                      beneficiary
                                    ]
                              }
                  } 
            },
            (new BN(1000000000) )
        )     
        .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
            // console.log(`Current status: `,status,` Current status is ${status.type}`);
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            // });  
            
            // const _token = "PHA";

            let errorInfo;
            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorInfo = `${section}.${name}`;
                console.log(`txCurrencyBasiliskToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
                console.log(`txCurrencyBasiliskToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
              }
            }
            else console.log(`txCurrencyBasiliskToParachain ***** NO DISAPTCHEERROR *****: `);

            if (status.isFinalized) {
              let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

              // Loop through all events
              events.forEach(async ({ phase, event: { data, method, section } }) => {
                  const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                  // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                  if (method==="ExtrinsicSuccess") 
                  {
                    // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                    ExtrinsicResult = "Succeeded"; 
                    const extrinsicBlockHash = status.asFinalized;
                    const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                    signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                      if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                    });
  
                    const txSendMsg = 
                                        [
                                          `Extrinsic hash: ${extrinsicHash}`,
                                          `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                          `Xcmp Message Sent: ${XcmpMessageSent}`,
                                        ];  
                    resolve(txSendMsg);
                  }
                  else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                  else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                  // else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                  // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                  // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
              });

              txCurrencyBasiliskToParachain();
            }
            
        });
            
    })
        
}
//#endregion 


//#region ***** Alterantive Transfer Currency With Fee from RococoBasilisk to Parachain //*****   
//BSX FROM BASILISK TO KARURA or PHALA
const  rococo_transfer_currencyWithFee  = async (currency, parachain, account, amount="1", fees=1) => {
  return new Promise (async (resolve, reject) => {
  
        if (!polkadotInjector || !polkadotInjectorAddress) {
          console.log(`rococo_transfer_currencyWithFee polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
          resolve("Polkadot Extension Error Please Refresh Dapp");
          return;
        }

        const api = Rococo_BasiliskApi;

        let currencyId;
        if (currency==="BSX") currencyId=0;
        else if (currency==="PHA") currencyId=1;

        
        let beneficiary, mantissa; 
        if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
        {
          beneficiary =  { accountKey20: { network: "Any",  key: account } };
          mantissa = mantissa18;
        }
        else
        {
          const accountId32tohexvalue = getAccountIdtoHex(account);  
          beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
          mantissa = mantissa12;
        }


        const txCurrencyWithFeeBasiliskToParachain = await api.tx.xTokens
        .transferWithFee(
            currencyId, 
            (new BN(amount * mantissa)),
            (new BN(fees * mantissa12)),
            { V1: {
                    parents: 1,
                    interior: {
                                x2: [
                                      { 
                                        Parachain: parachain,
                                      },
                                      beneficiary
                                    ]
                              }
                  } 
            },
            (new BN(1000000000) )
        )     
        .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
            // console.log(`Current status: `,status,` Current status is ${status.type}`);
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            // });  
            
            // const _token = "PHA";

            let errorInfo;
            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorInfo = `${section}.${name}`;
                console.log(`txCurrencyWithFeeBasiliskToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
                console.log(`txCurrencyWithFeeBasiliskToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
              }
            }
            else console.log(`txCurrencyWithFeeBasiliskToParachain ***** NO DISAPTCHEERROR *****: `);

            if (status.isFinalized) {
              let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

              // Loop through all events
              events.forEach(async ({ phase, event: { data, method, section } }) => {
                  const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                  // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                  if (method==="ExtrinsicSuccess") 
                  {
                    // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                    ExtrinsicResult = "Succeeded"; 
                    const extrinsicBlockHash = status.asFinalized;
                    const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                    signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                      if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                    });
  
                    const txSendMsg = 
                                        [
                                          `Extrinsic hash: ${extrinsicHash}`,
                                          `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                          `Xcmp Message Sent: ${XcmpMessageSent}`,
                                        ];  
                    resolve(txSendMsg);
                  }
                  else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                  else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                  // else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                  // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                  // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
              });

              txCurrencyWithFeeBasiliskToParachain();
            }
            
        });
            
    })
        
}
//#endregion 


//#region ***** Alterantive Transfer Multi Currencies from RococoBasilisk to Parachain //*****   
//BSX FROM BASILISK TO KARURA or PHALA
const  rococo_transfer_multiCurrencies  = async (currency, parachain, account, amount="1") => {
  return new Promise (async (resolve, reject) => {
  
        if (!polkadotInjector || !polkadotInjectorAddress) {
          console.log(`rococo_transfer_multiCurrencies polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
          resolve("Polkadot Extension Error Please Refresh Dapp");
          return;
        }

        const api = Rococo_BasiliskApi;

        let currencyId;
        if (currency==="BSX") currencyId=0;
        else if (currency==="PHA") currencyId=1;

        
        let beneficiary, mantissa; 
        if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
        {
          beneficiary =  { accountKey20: { network: "Any",  key: account } };
          mantissa = mantissa18;
        }
        else
        {
          const accountId32tohexvalue = getAccountIdtoHex(account);  
          beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
          mantissa = mantissa12;
        }


        const txMultiCurrenciesBasiliskToParachain = await api.tx.xTokens
        .transferMulticurrencies(
            [ 
              [ currencyId, (new BN(amount * mantissa)) ] 
            ],
            0,
            { V1: {
                    parents: 1,
                    interior: {
                                x2: [
                                      { 
                                        Parachain: parachain,
                                      },
                                      beneficiary
                                    ]
                              }
                  } 
            },
            (new BN(1000000000) )
        )     
        .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
            // console.log(`Current status: `,status,` Current status is ${status.type}`);
            // events.forEach(({ phase, event: { data, method, section } }) => {
            //   console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            // });  
            
            // const _token = "PHA";

            let errorInfo;
            if (dispatchError) {
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;
                errorInfo = `${section}.${name}`;
                console.log(`txMultiCurrenciesBasiliskToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
                console.log(`txMultiCurrenciesBasiliskToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
              }
            }
            else console.log(`txMultiCurrenciesBasiliskToParachain ***** NO DISAPTCHEERROR *****: `);

            if (status.isFinalized) {
              let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

              // Loop through all events
              events.forEach(async ({ phase, event: { data, method, section } }) => {
                  const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                  // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                  if (method==="ExtrinsicSuccess") 
                  {
                    // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                    ExtrinsicResult = "Succeeded"; 
                    const extrinsicBlockHash = status.asFinalized;
                    const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                    signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                      if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                    });
  
                    const txSendMsg = 
                                        [
                                          `Extrinsic hash: ${extrinsicHash}`,
                                          `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                          `Xcmp Message Sent: ${XcmpMessageSent}`,
                                        ];  
                    resolve(txSendMsg);
                  }
                  else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                  else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                  // else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                  // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                  // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
              });

              txMultiCurrenciesBasiliskToParachain();
            }
            
        });
            
    })
        
}
//#endregion 


//#region ***** Transfer Multiple Assets from Parachain to Parachain //*****    
//BSX FROM BASILISK TO KARURA or PHALA
const rococo_transfer_MultiAssetS_FromParachainToParachain = async (_token="BSX", originParachain=2000, parachain=1000, account, amount="1") => {
  return new Promise (async (resolve, reject) => {

           if (!polkadotInjector || !polkadotInjectorAddress) {
             console.log(`transfer_Currency_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
             resolve("Polkadot Extension Error Please Refresh Dapp");
             return;
           }

           let api = apiObj[`${originParachain}`];
           const general_key = `0x${generalKeyWithout_0x[_token]}`;

           let beneficiary, mantissa; 
           if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
           {
             beneficiary =  { accountKey20: { network: "Any",  key: account } };
             general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
           }
           else
           {
             const accountId32tohexvalue = getAccountIdtoHex(account);  
             beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
             general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
           }



           let multiAssetLocation;
           if (_token.toLowerCase()==="ksm") multiAssetLocation = "Here";
           else
           {
             multiAssetLocation =  {
                                     x2: [
                                           { 
                                               Parachain: tokenBirthChain[_token],
                                           },
                                           {
                                               Generalkey: general_key  
                                           }
                                         ]
                                   };
           }


           const txMultiAssetSParachainToParachain = await api.tx.xTokens
           .transferMultiassets(
               { V1: 
                    [
                         { 
                             id:  { 
                                   Concrete: { 
                                               parents: 1, 
                                               interior: multiAssetLocation
                                             } 
                                   },
                             fun: { Fungible: (new BN(amount * mantissa)) }
                         }
                    ]
               },
               0,
               { V1: {
                               parents: 1,
                               interior: {
                                   x2: [
                                         { 
                                           Parachain: parachain,
                                         },
                                         beneficiary
                                       ]
                               }
                       } 
               },
               (new BN(1000000000) )
           )      
           .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
               // console.log(`Current status: `,status,` Current status is ${status.type}`);
               let errorInfo;
               if (dispatchError) {
                 if (dispatchError.isModule) {
                   // for module errors, we have the section indexed, lookup
                   const decoded = api.registry.findMetaError(dispatchError.asModule);
                   const { docs, name, section } = decoded;
                   errorInfo = `${section}.${name}`;
                   console.log(`txMultiAssetSParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                   //Exampleof Error message:  txAssetParachainToParachain dispatchError1 xTokens.NotCrossChainTransfer: Not cross-chain transfer.
                 } else {
                   // Other, CannotLookup, BadOrigin, no extra info
                   errorInfo = dispatchError.toString();
                   console.log(`txMultiAssetSParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
                 }
               }
               else console.log(`txMultiAssetSParachainToParachain ***** NO DISAPTCHEERROR *****: `);

               if (status.isFinalized) {
                 let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

                 // Loop through all events
                 events.forEach(async ({ phase, event: { data, method, section } }) => {
                     const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                     // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                     if (method==="ExtrinsicSuccess") 
                     {
                       // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                       ExtrinsicResult = "Succeeded"; 
                       const extrinsicBlockHash = status.asFinalized;
                       const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                       signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                         if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                       });
     
                       const txSendMsg = 
                                           [
                                             `Extrinsic hash: ${extrinsicHash}`,
                                             `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                             `Xcmp Message Sent: ${XcmpMessageSent}`,
                                           ];  
                       resolve(txSendMsg);
                     }
                     else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                     else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                     //  else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                     // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                     // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                 });
                 
                 txMultiAssetSParachainToParachain();
               }
               
           });
               
   })

}
//#endregion 


//#region ***** Transfer MultiAssetWithFee from Parachain to Parachain //*****    
//BSX FROM BASILISK TO KARURA or PHALA
const rococo_transfer_MultiAssetWithFee_FromParachainToParachain = async (_token="BSX", originParachain=2000, parachain=1000, account, amount="1", feeAmount="1") => {
  return new Promise (async (resolve, reject) => {

           if (!polkadotInjector || !polkadotInjectorAddress) {
             console.log(`transfer_Currency_FromParachainToParachain polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`);
             resolve("Polkadot Extension Error Please Refresh Dapp");
             return;
           }

           let api = apiObj[`${originParachain}`];
           const general_key = `0x${generalKeyWithout_0x[_token]}`;

           let beneficiary, mantissa; 
           if (parachain===1000 || parachain===2023) //MoonbaseAlpha or Moonriver
           {
             beneficiary =  { accountKey20: { network: "Any",  key: account } };
             general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
           }
           else
           {
             const accountId32tohexvalue = getAccountIdtoHex(account);  
             beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
             general_key==="0x000b"? mantissa = mantissa8   : mantissa = mantissa12;
           }



           let multiAssetLocation;
           if (_token.toLowerCase()==="ksm") multiAssetLocation = "Here";
           else
           {
             multiAssetLocation =  {
                                     x2: [
                                           { 
                                               Parachain: tokenBirthChain[_token],
                                           },
                                           {
                                               Generalkey: general_key  
                                           }
                                         ]
                                   };
           }


           const feeMultiAssetLocation =  {
                                            x2: [
                                                  { 
                                                      Parachain: "2090",   //Basilisk
                                                  },
                                                  {
                                                      Generalkey: `0x00000000`  
                                                  }
                                                ]
                                          };


           const txMultiAssetWithFeeParachainToParachain = await api.tx.xTokens
           .transferMultiassetWithFee(
               { V1: 
                         { 
                             id:  { 
                                   Concrete: { 
                                               parents: 1, 
                                               interior: multiAssetLocation
                                             } 
                                   },
                             fun: { Fungible: (new BN(amount * mantissa)) }
                         }
               },

               { V1: 
                { 
                    id:  { 
                          Concrete: { 
                                      parents: 1, 
                                      interior: feeMultiAssetLocation
                                    } 
                          },
                    fun: { Fungible: (new BN(feeAmount * mantissa12)) }
                }
               },

               { V1: {
                               parents: 1,
                               interior: {
                                   x2: [
                                         { 
                                           Parachain: parachain,
                                         },
                                         beneficiary
                                       ]
                               }
                       } 
               },
               (new BN(1000000000) )
           )      
           .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, async ({ status, events=[], dispatchError }) => {
               // console.log(`Current status: `,status,` Current status is ${status.type}`);
               let errorInfo;
               if (dispatchError) {
                 if (dispatchError.isModule) {
                   // for module errors, we have the section indexed, lookup
                   const decoded = api.registry.findMetaError(dispatchError.asModule);
                   const { docs, name, section } = decoded;
                   errorInfo = `${section}.${name}`;
                   console.log(`txMultiAssetWithFeeParachainToParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                   //Exampleof Error message:  txAssetParachainToParachain dispatchError1 xTokens.NotCrossChainTransfer: Not cross-chain transfer.
                 } else {
                   // Other, CannotLookup, BadOrigin, no extra info
                   errorInfo = dispatchError.toString();
                   console.log(`txMultiAssetWithFeeParachainToParachain dispatchError2: `,dispatchError.toString(),"errorInfo: ",errorInfo);
                 }
               }
               else console.log(`txMultiAssetWithFeeParachainToParachain ***** NO DISAPTCHEERROR *****: `);

               if (status.isFinalized) {
                 let ExtrinsicResult, extrinsicHash, originFees, tranferredAmount, treasuryFees, XcmpMessageSent;

                 // Loop through all events
                 events.forEach(async ({ phase, event: { data, method, section } }) => {
                     const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                     // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                     if (method==="ExtrinsicSuccess") 
                     {
                       // txResult +=` Extrisnic Succeeded with Fees: ${data[0].weight}`;
                       ExtrinsicResult = "Succeeded"; 
                       const extrinsicBlockHash = status.asFinalized;
                       const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                       signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                         if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                       });
     
                       const txSendMsg = 
                                           [
                                             `Extrinsic hash: ${extrinsicHash}`,
                                             `Finalised at Block Hash: ${extrinsicBlockHash}`,
                                             `Xcmp Message Sent: ${XcmpMessageSent}`,
                                           ];  
                       resolve(txSendMsg);
                     }
                     else if (method==="ExtrinsicFailed")  resolve(["Extrinsic Failed"]);
                     else if (method==="XcmpMessageSent" && section==="xcmpQueue") XcmpMessageSent = `${data[0]}`;
                     //  else if (method==="Deposit" && section==="treasury") treasuryFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[0]}`),12)}`;  
                     // else if (method==="Withdrawn" && section==="currencies") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;   
                     // else if (method==="Deposited"  && section==="currencies")  txResult +=` Deposited ${JSON.parse(data[0]).token} to ${data[1]}  ${_token}:${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;
                 });
                 
                 txMultiAssetWithFeeParachainToParachain();
               }
               
           });
               
   })

}
//#endregion 


//#endregion ***** ROCOCO_BASILISK  //***** 




//#region ***** Setup Substrate Chains //*****
const setup_SubstrateChain = async (wsURL = 'MoonbaseAlpha') => {
  console.log("setup_Moonbeam is RUN");

  let WS_URL;
  //mainnet
  if (wsURL === 'Moonriver')     WS_URL = 'wss://wss.moonriver.moonbeam.network'; 
  else if (wsURL === 'Polkadot') WS_URL = 'wss://rpc.polkadot.io'; 
  else if (wsURL === 'Kusama')   WS_URL = 'wss://kusama-rpc.polkadot.io'; 
  else if (wsURL === 'Karura')   WS_URL = 'wss://karura.api.onfinality.io/public-ws'; 
  else if (wsURL === 'Kintsugi') WS_URL =  'wss://kintsugi.api.onfinality.io/public-ws'; 
  else if (wsURL === 'Phala')    WS_URL = 'wss://khala.api.onfinality.io/public-ws'; 
  else if (wsURL === 'Shiden')    WS_URL = 'wss://shiden.api.onfinality.io/public-ws'; 
  else if (wsURL === 'Basilisk')    WS_URL = 'wss://rpc.basilisk.cloud'; 

  //testnets
  else if (wsURL === 'MoonbaseRelayTestnet') WS_URL = 'wss://frag-moonbase-relay-rpc-ws.g.moonbase.moonbeam.network'; 
  else if (wsURL === 'MoonbaseAlpha')        WS_URL = 'wss://wss.api.moonbase.moonbeam.network'; 
  else if (wsURL === 'KaruraAlphanet')       WS_URL = 'wss://crosschain-dev.polkawallet.io:9908'; 
  else if (wsURL === 'BifrostAlphanet')      WS_URL = 'wss://moonriver.bifrost-rpc.testnet.liebi.com/ws'; 
  else if (wsURL === 'KintsugiAlphanet')     WS_URL = 'wss://api-dev-moonbeam.interlay.io/parachain'; 
  else if (wsURL === 'Rococo_Phala')         WS_URL = 'wss://rhala-api.phala.network/ws'; 
  else if (wsURL === 'Rococo_Basilisk')      WS_URL = 'wss://rpc-01.basilisk-rococo.hydradx.io'; 
  else if (wsURL === 'Rococo_Karura')        WS_URL = 'wss://karura-rococo.aca-dev.network'; 

   
  const wsProvider = new WsProvider(WS_URL);

  // Wait for Provider
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;
  console.log(`api => : `,api);
  return {api};
};
//#endregion 



//#region 
const getAvailableBalance = async (account, token=null, metamaskAccount, network=null) => {
      if (!token || !account ) { console.log("No token or account has been provided for getAvailableBalance"); return null }

      if ( !KusamaApi || !KaruraApi || !MoonriverApi || !KintsugiApi || !PhalaApi )
      { 
        console.log("Some of the APIs are not set up. Please Refresh Dapp");
        //TODO APIManagement 
        return null; 
      }

      /*Phala   BSX:5 KAR:1 AUSD:4 KSM:0 MOVR:6 */
      // const accountIsEVMaddress = ethers.utils.isAddress( account )
      // // console.log(`account: ${account} accountIsEVMaddress : ${accountIsEVMaddress}`);
      // let accounts; //will have this schema { substrate_Address, kusama_Address, karura_Address, moonriver_Address, moonbeam_Address,  shiden_Address, khala_Address, kintsugi_Address, hydraDX_Address, basilisk_Address, crust_Address, zeitgeist_Address, calamari_Address, manta_Address, }
      // if (accountIsEVMaddress) accounts = getAccountFormatsforAccountId20(account)
      // else accounts = getAccountFormatsforAccountI32(account);

      //We will use MetaMask loaded account and not the Substrate => H160 and vice versa
      // const moonriverAddress = metamaskAccount;
      const accounts = getAccountFormatsforAccountI32(account);
      const {kusama_Address, karura_Address, kintsugi_Address, khala_Address } = accounts;

      
      // let response;
      if (token.toLowerCase()==="ksm")
      {
        const timestamp = await KusamaApi.query.timestamp.now();   

        //Kusama
        const { nonce, data: balanceKusama } = await KusamaApi.query.system.account(kusama_Address);   // Retrieve the account balance & nonce via the system module
        let KusamaBalance = null;
        if (balanceKusama) 
        KusamaBalance = Number( ethers.utils.formatUnits( (balanceKusama.free).toString(), 12) ).toFixed(4)
        // console.log(`KSM KUSAMA Now => ${timestamp}: For account:${kusama_Address} Kusama ${token} balance Free: ${KusamaBalance} `);

        //Karura
        const {free: free1 , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(karura_Address, {Token: token.toLowerCase() }); 
        const KaruraBalance = Number(ethers.utils.formatUnits( free1.toString(), 12)).toFixed(4);
        // console.log(`Karura For account:${karura_Address}  Token: ${token} => ${timestamp}: balance free: ${KaruraBalance} reserved: ${reserved1} frozen: ${frozen1}`);

        //Moonriver
        // const balanceMoonriver = await MoonriverApi.query.assets.account("42259045809535163221576417993425387648", moonriverAddress );  //"0xa95b7843825449DC588EC06018B48019D1111000"
        // let MoonriverBalance = null;
        // if (balanceMoonriver.toJSON()) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( balanceMoonriver.toJSON().balance, 12) ).toFixed(4);
        // console.log(`Moonriver  For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);

        //Kintsugi
        // const {free: free3 , reserved: reserved3, frozen: frozen3} = await KintsugiApi.query.tokens.accounts(kintsugi_Address, {Token: token.toLowerCase() }); 
        // const KintsugiBalance =  Number(ethers.utils.formatUnits( free3.toString(), 12)).toFixed(4);
        // // console.log(`Kintsugi  For account:${kintsugi_Address} Token: ${token} => ${timestamp}: balance free: ${KintsugiBalance} `);

        //Phala
        // const Phala_balanceObj = await PhalaApi.query.assets.account( 0,  khala_Address ); 
        // let PhalaBalance = null;
        // if (Phala_balanceObj.toJSON()) 
        // PhalaBalance = Number( ethers.utils.formatUnits( Phala_balanceObj.toJSON().balance, 12) ).toFixed(4);
        // console.log(`Phala For account:${khala_Address} Token: ${token} => ${timestamp}: balance free: ${PhalaBalance}`);

        // //Shiden  
        // const balanceShiden = await ShidenApi.query.assets.account("340282366920938463463374607431768211455", shiden_Address );  
        // let ShidenBalance = null;
        // if (balanceShiden.toJSON()) 
        // ShidenBalance = Number( ethers.utils.formatUnits( balanceShiden.toJSON().balance, 12) ).toFixed(4);
        // console.log(`Shiden  For account:${shiden_Address} Token: ${token} => ${timestamp}: balance free: ${ShidenBalance} `);

        const balances = { token, timestamp: new Date(timestamp).toISOString, Kusama: KusamaBalance,  Karura: KaruraBalance, Basilisk: null };
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: KusamaBalance,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Basilisk: null };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances};
      }
      else  if (token.toLowerCase()==="kar") 
      {

        const timestamp = await KusamaApi.query.timestamp.now();   

        //Karura
        const { nonce, data: balance } = await KaruraApi.query.system.account(karura_Address);   // Retrieve the account balance & nonce via the system module
        let KaruraBalance = null;
        if (balance) 
        KaruraBalance = Number( ethers.utils.formatUnits( (balance.free).toString(), 12) ).toFixed(4)
        // console.log(`Now => ${timestamp}: Karura  For account:${karura_Address}   ${token} balance Free: ${KaruraBalance} reserved: ${balance.reserved} frozen: ${balance.frozen} and nonce: ${nonce}`);
      
        // //Moonriver
        // const balanceMoonriver = await MoonriverApi.query.assets.account("10810581592933651521121702237638664357", moonriverAddress );  //"0xa95b7843825449DC588EC06018B48019D1111000"
        // let MoonriverBalance = null;
        // if (balanceMoonriver.toJSON()) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( (balanceMoonriver.toJSON()).balance, 12) ).toFixed(4);
        // // console.log(`Moonriver For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);
        
        // //Kintsugi
        // const KintsugiBalance = null;

        // // Phala
        // const Phala_balanceObj = await PhalaApi.query.assets.account( 1,  khala_Address ); 
        // let PhalaBalance = null;
        // if (Phala_balanceObj.toJSON()) 
        // PhalaBalance = Number( ethers.utils.formatUnits( Phala_balanceObj.toJSON().balance, 12) ).toFixed(4);
        // console.log(`Phala  For account:${khala_Address} Token: ${token} => ${timestamp}: balance free: ${PhalaBalance}`);
        
        const balances = {token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, };
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Rococo_Basilisk: null, Rococo_Phala: null, Rococo_Karura: null };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances};
      }
      else  if (token.toLowerCase()==="movr") 
      {

        const timestamp = await KusamaApi.query.timestamp.now();   

        //Karura
        const {free: free1 , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(karura_Address, {ForeignAsset: 3 }); 
        const KaruraBalance = Number(ethers.utils.formatUnits( free1.toString(), 18)).toFixed(4);
        // console.log(`Karura For account: ${karura_Address} Token: ${token} => ${timestamp}: balance free: ${KaruraBalance} reserved: ${reserved1} frozen: ${frozen1}`);

        // //Moonriver
        // const { nonce, data: balance } = await MoonriverApi.query.system.account(moonriverAddress);   // Retrieve the account balance & nonce via the system module
        // // console.log(`Moonriver MOVR balance: `,balance.toJSON())
        // let MoonriverBalance = null;
        // if (balance) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( (balance.toJSON()).free, 18) ).toFixed(4);
        // // console.log(`Moonriver For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);

        // //Kintsugi
        // const KintsugiBalance = null;

        // // Phala
        // const Phala_balanceObj = await PhalaApi.query.assets.account( 6,  khala_Address ); 
        // let PhalaBalance = null;
        // if (Phala_balanceObj.toJSON()) 
        // PhalaBalance = Number( ethers.utils.formatUnits( Phala_balanceObj.toJSON().balance, 18) ).toFixed(4);
        // // console.log(`Phala  For account:${khala_Address} Token: ${token} => ${timestamp}: balance free: ${PhalaBalance}`);
        
        const balances = { token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance,  };
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Rococo_Basilisk: null, Rococo_Phala: null, Rococo_Karura: null  };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances};
      }
      else  if (token.toLowerCase()==="ausd")  
      {

        const timestamp = await KusamaApi.query.timestamp.now();   

        //Karura
        const {free: free1 , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(karura_Address, {Token: "kusd" }); 
        const KaruraBalance = Number(ethers.utils.formatUnits( free1.toString(), 12)).toFixed(4);
        // console.log(`***** Karura For account: ${karura_Address} Token: ${token} => ${timestamp}: balance free: ${KaruraBalance} reserved: ${reserved1} frozen: ${frozen1}`);

        // //Moonriver
        // const balanceMoonriver = await MoonriverApi.query.assets.account("214920334981412447805621250067209749032", moonriverAddress );  //"0xa95b7843825449DC588EC06018B48019D1111000"
        // let MoonriverBalance = null;
        // if (balanceMoonriver.toJSON()) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( balanceMoonriver.toJSON().balance, 12) ).toFixed(4);
        // // console.log(`Moonriver For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);

        // //Kintsugi
        // const KintsugiBalance = null;

        // // Phala
        // const Phala_balanceObj = await PhalaApi.query.assets.account( 4,  khala_Address ); 
        // let PhalaBalance = null;
        // if (Phala_balanceObj.toJSON()) 
        // PhalaBalance = Number( ethers.utils.formatUnits( Phala_balanceObj.toJSON().balance, 12) ).toFixed(4);
        // // console.log(`Phala  For account:${khala_Address} Token: ${token} => ${timestamp}: balance free: ${PhalaBalance}`);
        
        const balances = { token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, };
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Rococo_Basilisk: null, Rococo_Phala: null, Rococo_Karura: null  };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances};
      }
      else  if (token.toLowerCase()==="kint") 
      {

        const timestamp = await KusamaApi.query.timestamp.now();   

        //Karura
        const {free: free1 , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(karura_Address, {Token: token.toLowerCase() }); 
        const KaruraBalance = Number(ethers.utils.formatUnits( free1.toString(), 12)).toFixed(4);
        console.log(`Karura For account: ${karura_Address} Token: ${token} => ${timestamp}: balance free: ${KaruraBalance} reserved: ${reserved1} frozen: ${frozen1}`);

        // //Moonriver
        // const balanceMoonriver = await MoonriverApi.query.assets.account("175400718394635817552109270754364440562", moonriverAddress );  //"0xa95b7843825449DC588EC06018B48019D1111000"
        // let MoonriverBalance = null;
        // if (balanceMoonriver.toJSON()) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( balanceMoonriver.toJSON().balance, 12) ).toFixed(4);
        // // console.log(`Moonriver For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);

        // //Kintsugi
        // const {free: free3 , reserved: reserved3, frozen: frozen3} = await KintsugiApi.query.tokens.accounts(kintsugi_Address, {Token: token.toLowerCase() }); 
        // const KintsugiBalance =  Number(ethers.utils.formatUnits( free3.toString(), 12)).toFixed(4);
        // // console.log(`Kintsugi For account:${kintsugi_Address} Token: ${token} => ${timestamp}: balance free: ${KintsugiBalance} `);
            
        // // Phala
        // const PhalaBalance = null
        
        const balances = { token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, };
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Rococo_Basilisk: null, Rococo_Phala: null, Rococo_Karura: null  };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances };
      }
      else  if (token.toLowerCase()==="kbtc") 
      {

        const timestamp = await KusamaApi.query.timestamp.now();   

        //Karura
        const {free: free1 , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(karura_Address, {Token: token.toLowerCase() }); 
        const KaruraBalance = Number(ethers.utils.formatUnits( free1.toString(), 8)).toFixed(4);
        // console.log(`Karura For account: ${karura_Address} Token: ${token} => ${timestamp}: balance free: ${KaruraBalance} reserved: ${reserved1} frozen: ${frozen1}`);

        // //Moonriver
        // const balanceMoonriver = await MoonriverApi.query.assets.account("328179947973504579459046439826496046832", moonriverAddress );  //"0xa95b7843825449DC588EC06018B48019D1111000"
        // let MoonriverBalance = null;
        // if (balanceMoonriver.toJSON()) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( balanceMoonriver.toJSON().balance, 8) ).toFixed(4);
        // // console.log(`Moonriver For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);

        // //Kintsugi
        // const {free: free3 , reserved: reserved3, frozen: frozen3} = await KintsugiApi.query.tokens.accounts(kintsugi_Address, {Token: token.toLowerCase() }); 
        // const KintsugiBalance =  Number(ethers.utils.formatUnits( free3.toString(), 8)).toFixed(4);
        // // console.log(`Kintsugi For account:${kintsugi_Address} Token: ${token} => ${timestamp}: balance free: ${KintsugiBalance} `);
            
        // // Phala
        // const PhalaBalance = null
        
        const balances = { token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance,};
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Rococo_Basilisk: null, Rococo_Phala: null, Rococo_Karura: null  };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances };
      }
      else  if (token.toLowerCase()==="pha") 
      {

        const timestamp = await KusamaApi.query.timestamp.now();   

        //Karura
        const {free: free1 , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(karura_Address, {Token: token.toLowerCase() }); 
        const KaruraBalance = Number(ethers.utils.formatUnits( free1.toString(), 12)).toFixed(4);
        // console.log(`Karura For account: ${karura_Address} Token: ${token} => ${timestamp}: balance free: ${KaruraBalance} reserved: ${reserved1} frozen: ${frozen1}`);

        //Moonriver
        // const balanceMoonriver = await MoonriverApi.query.assets.account("189307976387032586987344677431204943363", moonriverAddress );  //"0xa95b7843825449DC588EC06018B48019D1111000"
        // let MoonriverBalance = null;
        // if (balanceMoonriver.toJSON()) 
        // MoonriverBalance = Number( ethers.utils.formatUnits( balanceMoonriver.toJSON().balance, 12) ).toFixed(4);
        // // console.log(`Moonriver For account:${moonriverAddress} Token: ${token} => ${timestamp}: balance free: ${MoonriverBalance} `);

        // //Kintsugi
        // const KintsugiBalance =  null;
            
        // // Phala
        // const { nonce, data: balance } = await PhalaApi.query.system.account(khala_Address);   // Retrieve the account balance & nonce via the system module
        // let PhalaBalance = null;
        // if (balance) 
        // PhalaBalance = Number( ethers.utils.formatUnits( (balance.free).toString(), 12) ).toFixed(4)
        // console.log(`Now => ${timestamp}: Phala  For account:${khala_Address} ${token} balance Free: ${PhalaBalance}`);
        
        const balances = { token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance,};
        // response = { accountFormats: accounts, token, timestamp: new Date(timestamp).toISOString, Kusama: null,  Karura: KaruraBalance, Moonriver: MoonriverBalance, Kintsugi: KintsugiBalance, Phala: PhalaBalance, Rococo_Basilisk: null, Rococo_Phala: null, Rococo_Karura: null  };
        // console.log("getAvailableBalance => response: ", response);
        return {accounts, balances };
      }
}
//#endregion 



//#region ***** ROCOCO_BASILISK  GetBalances //***** 
const getRococo_AvailableBalance = async (account, token=null, metamaskAccount, network=null) => {
  if (!token || !account || !metamaskAccount) { console.log("No token or account or metamaskAccount has been provided for getAvailableBalance"); return null }

  if ( !Rococo_BasiliskApi || !Rococo_KaruraApi || !Rococo_RhalaApi )
  { 
    console.log("Some of the Rococo APIs are not set up. Please Refresh Dapp");
    return null; 
  }

  const accounts = getAccountFormatsforAccountI32(account);
  const {basilisk_Address, karura_Address, khala_Address } = accounts;

  if (token.toLowerCase()==="bsx") 
  {
    const timestamp = await Rococo_BasiliskApi.query.timestamp.now();   

    //Basilisk
    const { nonce, data: balance } = await Rococo_BasiliskApi.query.system.account(basilisk_Address);   // Retrieve the account balance & nonce via the system module
    let BasiliskBalance = null;
    if (balance) 
    BasiliskBalance = Number( ethers.utils.formatUnits( (balance.free).toString(), 12) ).toFixed(4)

    //Karura
    const {free: free1 , reserved: reserved1, frozen: frozen1}  = await Rococo_KaruraApi.query.tokens.accounts(karura_Address, {ForeignAsset: 2});    
    const KaruraBalance = Number( ethers.utils.formatUnits( free1.toString(), 12) ).toFixed(4)
  

    // Phala
    const Phala_balanceObj = await Rococo_RhalaApi.query.assets.account( 5,  khala_Address ); 
    let PhalaBalance = null;
    if (Phala_balanceObj.toJSON()) 
    PhalaBalance = Number( ethers.utils.formatUnits( (Phala_balanceObj.toJSON()).balance, 12) ).toFixed(4);
    
    const balances = {token, timestamp: new Date(timestamp).toISOString, Basilisk: BasiliskBalance,  Karura: KaruraBalance, Phala: PhalaBalance };
    console.log(`ROCOCO =====> balances: `,balances);

    return {accounts, balances};
  }
  else if (token.toLowerCase()==="kar") 
  {

    const timestamp = await Rococo_BasiliskApi.query.timestamp.now();   

    const BasiliskBalance = null;

    //Karura
    const { nonce, data: balance } = await Rococo_KaruraApi.query.system.account(karura_Address);   // Retrieve the account balance & nonce via the system module
    let KaruraBalance = null;
    if (balance) 
    KaruraBalance = Number( ethers.utils.formatUnits( (balance.free).toString(), 12) ).toFixed(4)
    // console.log(`Now => ${timestamp}: Karura  For account:${karura_Address}   ${token} balance Free: ${KaruraBalance} reserved: ${balance.reserved} frozen: ${balance.frozen} and nonce: ${nonce}`);
  
    // Phala
    const Phala_balanceObj = await Rococo_RhalaApi.query.assets.account( 1,  khala_Address ); 
    let PhalaBalance = null;
    if (Phala_balanceObj.toJSON()) 
    PhalaBalance = Number( ethers.utils.formatUnits( (Phala_balanceObj.toJSON()).balance, 12) ).toFixed(4);
    
    const balances = {token, timestamp: new Date(timestamp).toISOString, Basilisk: BasiliskBalance,  Karura: KaruraBalance, Phala: PhalaBalance };
    console.log(`ROCOCO =====> balances: `,balances);

    return {accounts, balances};
  }
  else  if (token.toLowerCase()==="pha") 
  {

    const timestamp = await Rococo_BasiliskApi.query.timestamp.now();  
    
    //Basilisk
    const {free: freePHA , reserved: reservedPHA, frozen: frozenPHA}  = await Rococo_BasiliskApi.query.tokens.accounts(basilisk_Address, 1);    
    const BasiliskBalance = Number( ethers.utils.formatUnits( freePHA.toString(), 12) ).toFixed(4);

    //Karura
    const KaruraBalance = null;

    // Phala
    const { nonce, data: balance } = await Rococo_RhalaApi.query.system.account(khala_Address);   // Retrieve the account balance & nonce via the system module
    let PhalaBalance = null;
    if (balance) 
    PhalaBalance = Number( ethers.utils.formatUnits( (balance.free).toString(), 12) ).toFixed(4)
    console.log(`Now => ${timestamp}: Phala  For account:${khala_Address} ${token} balance Free: ${PhalaBalance}`);
    
    const balances = {token, timestamp: new Date(timestamp).toISOString, Basilisk: BasiliskBalance,  Karura: KaruraBalance, Phala: PhalaBalance };
    console.log(`ROCOCO =====> balances: `,balances);

    return {accounts, balances };
  }
}

//#endregion 









//#region  ***** ACTIONS *****

  //#region ***** KARURA KSM STAKING *****

    //#region ***** Transfer from Relay to Parachain //*****   0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d is Pablo Moon Account
    const stakeKSMfromKusama = async (apiRelay, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {
      
      return new Promise (async (resolve, reject) => {

            if (!polkadotInjector || !polkadotInjectorAddress) {
              console.log(`stakeKSMfromKusama polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`)
              resolve("Polkadot Extension Error Please Refresh Dapp");
              return;
            }

            if (Number(amount)< 1.01) {
              console.log(`Inorder to stake KSM at Karura the minimum amount is 1 KSM plus XCM fees`);
              resolve("To stake KSM for LKSM the minimum amount is 1.01 KSM");
              return;
            }
            
            //Get KARURA KSM fresh Balance 
            const {free: freeKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(EVMaccount, {Token: "ksm" }); 
            // console.log(`====> FREE KSM ON KARURA: ${freeKSM}`);

          
            const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  
            const beneficiary = { 
                            V1: {
                                  parents: 0, 
                                  interior: { 
                                              X1: { 
                                                    AccountId32 : { 
                                                                    network: "Any", 
                                                                    id: accountId32tohexvalue 
                                                                  } 
                                                  } 
                                            } 
                                } 
                          };

            const amountWEI = new BN(amount * mantissa12);

            //XCM transfer
            const txRelaytoParachain = await apiRelay.tx.xcmPallet
            .limitedReserveTransferAssets(
                { V1: {parents: 0, interior: { X1: { Parachain: parachain } } } },
                beneficiary,
                { V1: [ 
                          { 
                              id:  { Concrete: { parents: 0, interior: "Here"} },
                              fun: { Fungible: amountWEI }
                          }
                      ] 
                },
              0, 
              {Limited: new BN(1000000000)}

            );
            const txRelaytoParachain_Signed =  await txRelaytoParachain.signAsync(polkadotInjectorAddress, { signer: polkadotInjector.signer });

            
            //Stake KSM at Karura
            const expectedFeesarrivingAtKarura =  new BN( 0.0001 * mantissa12 ); //actual fees 0.000077279003
            const amountWEI_toStake = amountWEI.sub(expectedFeesarrivingAtKarura);
            const txStakeKSM = await KaruraApi.tx.homa.mint( amountWEI_toStake )
            const txStakeKSM_Signed =  await txStakeKSM.signAsync(polkadotInjectorAddress, { signer: polkadotInjector.signer });


            txRelaytoParachain_Signed.send( async ({ status, events=[], dispatchError }) => {
                // console.log(`Current status: `,status,` Current status is ${status.type}`);
                let errorInfo;
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    // for module errors, we have the section indexed, lookup
                    const decoded = apiRelay.registry.findMetaError(dispatchError.asModule);
                    const { docs, name, section } = decoded;
                    errorInfo = `${section}.${name}`;
                    console.log(`txRelaytoParachain dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                  } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    errorInfo = dispatchError.toString();
                    console.log(`txRelaytoParachain dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
                  }
                }
                else console.log(`txRelaytoParachain ***** NO DISAPTCHEERROR *****: `);
                
                
                if (status.isFinalized) {
                  let originFees, tranferredAmount, ExtrinsicResult, extrinsicHash;
                  
                  // Loop through all events
                  events.forEach(async ({ phase, event: { data, method, section } }) => {
                    const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                    // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                    
                    if (method==="ExtrinsicSuccess") 
                    {
                        ExtrinsicResult = "Succeeded"; 
                      
                        const extrinsicBlockHash = status.asFinalized;
                        const signedBlock = await apiRelay.rpc.chain.getBlock(extrinsicBlockHash);
                        signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                          if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                        });

                        //Get KARURA KSM fresh Balance 
                        const {free: updatedfreeKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(EVMaccount, {Token: "ksm" }); 
                        // console.log(`BEFORE FEE KSM ON KARURA: ${freeKSM} UPDATED FREE KSM ON KARURA: ${updatedfreeKSM}`);
                        const changeKSMonKarura = updatedfreeKSM.sub(freeKSM);
                        // console.log(`========> CHANGE IN KSM IS ${changeKSMonKarura} `);
                        const netAmount = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${changeKSMonKarura}`),12)}`;
                        const fees_PaidatDestinationChain = amountWEI.sub(changeKSMonKarura);
                        const feesPaidatDestinationChain = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${fees_PaidatDestinationChain}`),12)}`;
                        
                        const txSendKSMMsg = 
                            [
                              `Kusama Extrinsic hash: ${extrinsicHash}`,
                              `Finalised at Block Hash: ${extrinsicBlockHash}`,
                              `OriginFees: ${originFees} tranferredAmount: ${tranferredAmount}`,
                              `Deposited netAmount: ${netAmount} Fees paid at destination chain:${feesPaidatDestinationChain}`
                            ];   
                        // console.log(txSendKSMMsg);


                            //#region Ready to stake KSM
                            console.log(`Sending transaction to stake KSM at Karura`);
                            txStakeKSM_Signed.send( async ({ status, events=[], dispatchError }) => {
                                    // console.log(`Current txStakeKSM_Signed status: `,status,` Current status is ${status.type}`);
                                    
                                    let errorInfo;
                                    if (dispatchError) {
                                      if (dispatchError.isModule) {
                                        // for module errors, we have the section indexed, lookup
                                        const decoded = KaruraApi.registry.findMetaError(dispatchError.asModule);
                                        const { docs, name, section } = decoded;
                                        errorInfo = `${section}.${name}`;
                                        console.log(`txStakeKSM_Signed dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                                      } else {
                                        // Other, CannotLookup, BadOrigin, no extra info
                                        errorInfo = dispatchError.toString();
                                        console.log(`txStakeKSM_Signed dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
                                      }
                                    }
                                    else console.log(`txStakeKSM_Signed ***** NO DISAPTCHEERROR *****: `);

                                      
                                    if (status.isFinalized) {
                                      let  KaruraExtrinsicResult, KaruraExtrinsicHash;
                                      
                                      // Loop through all events
                                      events.forEach(async ({ phase, event: { data, method, section } }) => {  
                                          const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                                          // console.log(`Staking KSM at Karura \t' ${phase}: ${section}.${method}:: ${data}`);
                                          
                                          if (method==="ExtrinsicSuccess") 
                                          {
                                            KaruraExtrinsicResult = "Succeeded"; 
                                            
                                            const KaruraextrinsicBlockHash = status.asFinalized;
                                            const signedBlock = await KaruraApi.rpc.chain.getBlock(KaruraextrinsicBlockHash);
                                            signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                                              if (index===Number(extrinsicIndexinBlock)) KaruraExtrinsicHash = `${hash.toString()}`
                                            });
                                            // console.log(`Staking Extrinsic has succeeded`);
                                            const {free: freeLKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(EVMaccount, {Token: "lksm" }); 
                                            // console.log(`====> FREE LKSM ON KARURA: ${freeLKSM}`);
                                            const txStakingMsg = 
                                                [
                                                  `Staked KSM at Karura Extrinsic hash: ${KaruraExtrinsicHash} .`,
                                                  `Finalised at Block Hash: ${KaruraextrinsicBlockHash} .`,
                                                  `Updated Free LKSM Balance: ${ethers.utils.formatUnits(ethers.BigNumber.from(`${freeLKSM}`),12)}`
                                                ];
                                            // console.log(txStakingMsg); 
                                            resolve([...txSendKSMMsg, ...txStakingMsg]);
                                          }
                                          else if (method==="ExtrinsicFailed") 
                                          {
                                            KaruraExtrinsicResult = "Failed";   
                                            resolve(["Staking KSM action has failed"])
                                          }
                                    });

                                  }
                            });
                            //#endregion 

                      }
                      else if (method==="ExtrinsicFailed") ExtrinsicResult = "Failed";    
                      else if (method==="Withdraw") originFees = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[1]}`),12)}`;   
                      else if (method==="Transfer") tranferredAmount = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${data[2]}`),12)}`;  
                  });
                  
                }
                
            });

      })


    }
    //#endregion 


    //#region ***** stakeKSMfromKintsugi   
    const stakeKSMfromKintsugi = async (_token="KUSD", originParachain=2000, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {

      console.log("************************* ==== > WE ARE INSIDE stakeKSMfromKusama");
      return new Promise (async (resolve, reject) => {

            if (!polkadotInjector || !polkadotInjectorAddress) {
              console.log(`stakeKSMfromKintsugi polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`)
              resolve("Polkadot Extension Error Please Refresh Dapp");
              return;
            }

            if (Number(amount)< 1.01) {
              console.log(`In order to stake KSM at Karura the minimum amount is 1 KSM plus XCM fees`);
              resolve("To stake KSM for LKSM the minimum amount is 1.01 KSM");
              return;
            }

            const api = apiObj[`${originParachain}`];
            const accountId32tohexvalue = getAccountIdtoHex(EVMaccount);  
            const beneficiary = { AccountId32 : { network: "Any",  id : accountId32tohexvalue } };
            
            //Get KARURA KSM fresh Balance 
            const {free: freeKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(EVMaccount, {Token: "ksm" }); 
            //  console.log(`====> FREE KSM ON KARURA: ${freeKSM}`);


            const multiAssetLocation = "Here";
            const amountWEI = new BN(amount * mantissa12);

            //XCM transfer
            const txAssetParachainToParachain = await api.tx.xTokens
            .transferMultiasset(
                { V1: 
                          { 
                              id:  { 
                                    Concrete: { 
                                                parents: 1, 
                                                interior: multiAssetLocation
                                              } 
                                    },
                              fun: { Fungible: amountWEI }
                          }
                },
                { V1: {
                                parents: 1,
                                interior: {
                                    x2: [
                                          { 
                                            Parachain: parachain,
                                          },
                                          beneficiary
                                        ]
                                }
                        } 
                },
                (new BN(1000000000) )
            );      
            const txParachaintoParachain_Signed =  await txAssetParachainToParachain.signAsync(polkadotInjectorAddress, { signer: polkadotInjector.signer });

            
            //Stake KSM at Karura
            const expectedFeesarrivingAtKarura =  new BN( 0.0001 * mantissa12 ); //actual fees 0.000077279003
            const amountWEI_toStake = amountWEI.sub(expectedFeesarrivingAtKarura);
            const txStakeKSM = await KaruraApi.tx.homa.mint( amountWEI_toStake )
            const txStakeKSM_Signed =  await txStakeKSM.signAsync(polkadotInjectorAddress, { signer: polkadotInjector.signer });


            txParachaintoParachain_Signed.send( async ({ status, events=[], dispatchError }) => {
                let errorInfo;
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    const decoded = api.registry.findMetaError(dispatchError.asModule);
                    const { docs, name, section } = decoded;
                    errorInfo = `${section}.${name}`;
                    console.log(`txParachaintoParachain_Signed dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                  } else {
                    errorInfo = dispatchError.toString();
                    console.log(`txParachaintoParachain_Signed dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
                  }
                }
                else console.log(`txParachaintoParachain_Signed ***** NO DISAPTCHEERROR *****: `);
                
                
                if (status.isFinalized) {
                  let XcmpMessageSent, originFees, tranferredAmount, ExtrinsicResult, extrinsicHash;
                  
                  events.forEach(async ({ phase, event: { data, method, section } }) => {
                    const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                    // console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
                    
                    if (method==="ExtrinsicSuccess") 
                    {
                        ExtrinsicResult = "Succeeded"; 
                      
                        const extrinsicBlockHash = status.asFinalized;
                        const signedBlock = await api.rpc.chain.getBlock(extrinsicBlockHash);
                        signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                          if (index===Number(extrinsicIndexinBlock)) extrinsicHash = `${hash.toString()}`
                        });

                        //Get KARURA KSM fresh Balance 
                        const {free: updatedfreeKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(EVMaccount, {Token: "ksm" }); 
                        // console.log(`BEFORE FEE KSM ON KARURA: ${freeKSM} UPDATED FREE KSM ON KARURA: ${updatedfreeKSM}`);
                        const changeKSMonKarura = updatedfreeKSM.sub(freeKSM);
                        // console.log(`========> CHANGE IN KSM IS ${changeKSMonKarura} `);
                        const netAmount = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${changeKSMonKarura}`),12)}`;
                        const fees_PaidatDestinationChain = amountWEI.sub(changeKSMonKarura);
                        const feesPaidatDestinationChain = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${fees_PaidatDestinationChain}`),12)}`;
                        
                        const txSendKSMMsg = 
                          [
                            `Kintsugi Extrinsic hash: ${extrinsicHash} .`,
                            `Finalised at Block Hash: ${extrinsicBlockHash} .`, 
                            `TranferredAmount:${amount}  Deposited netAmount:${netAmount} Fees:${feesPaidatDestinationChain}`
                          ]

                        // console.log(txSendKSMMsg);


                        //#region Ready to stake KSM
                        // console.log(`Sending transaction to stake KSM at Karura`);
                        txStakeKSM_Signed.send( async ({ status, events=[], dispatchError }) => {
                                // console.log(`Current txStakeKSM_Signed status: `,status,` Current status is ${status.type}`);
                                
                                let errorInfo;
                                if (dispatchError) {
                                  if (dispatchError.isModule) {
                                    // for module errors, we have the section indexed, lookup
                                    const decoded = KaruraApi.registry.findMetaError(dispatchError.asModule);
                                    const { docs, name, section } = decoded;
                                    errorInfo = `${section}.${name}`;
                                    console.log(`txStakeKSM_Signed dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                                  } else {
                                    // Other, CannotLookup, BadOrigin, no extra info
                                    errorInfo = dispatchError.toString();
                                    console.log(`txStakeKSM_Signed dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
                                  }
                                }
                                else console.log(`txStakeKSM_Signed ***** NO DISAPTCHEERROR *****: `);

                                  
                                if (status.isFinalized) {
                                  let KaruraExtrinsicResult, KaruraExtrinsicHash;
                                  
                                  // Loop through all events
                                  events.forEach(async ({ phase, event: { data, method, section } }) => {  
                                      const extrinsicIndexinBlock = phase.asApplyExtrinsic;
                                      // console.log(`Staking KSM at Karura \t' ${phase}: ${section}.${method}:: ${data}`);
                                      
                                      if (method==="ExtrinsicSuccess") 
                                      {
                                        KaruraExtrinsicResult = "Succeeded"; 
                                        
                                        const KaruraextrinsicBlockHash = status.asFinalized;
                                        const signedBlock = await KaruraApi.rpc.chain.getBlock(KaruraextrinsicBlockHash);
                                        signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                                          if (index===Number(extrinsicIndexinBlock)) KaruraExtrinsicHash = `${hash.toString()}`
                                        });
                                        // console.log(`Staking Extrinsic has succeeded`);
                                        const {free: freeLKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(EVMaccount, {Token: "lksm" }); 
                                        // console.log(`====> FREE LKSM ON KARURA: ${freeLKSM}`);
                                        const txStakingMsg = 
                                            [
                                              `Staked KSM at Karura Extrinsic hash: ${KaruraExtrinsicHash} .`,
                                              `Finalised at Block Hash: ${KaruraextrinsicBlockHash} .`,
                                              `Updated Free LKSM Balance: ${ethers.utils.formatUnits(ethers.BigNumber.from(`${freeLKSM}`),12)}`
                                            ];
                                        // console.log(txStakingMsg); 
                                        resolve([...txSendKSMMsg, ...txStakingMsg]);
                                      }
                                      else if (method==="ExtrinsicFailed") 
                                      {
                                        KaruraExtrinsicResult = "Failed";    
                                        resolve(["Staking KSM action has failed"])
                                      }
                                });

                              }
                        });
                        //#endregion 

                      }
                      else if (method==="ExtrinsicFailed") ExtrinsicResult = "Failed";  
                  });
                  
                }
                
            });

      })

    }
    //#endregion 


    //#region ***** stakeKSMfromMoonriver   
    // const stakeKSMfromMoonriver = async (_token="KUSD", originParachain=2000, parachain=1000, EVMaccount="0x1270dbdE6Fa704f9363e47Dd05493D5dae329A4d", amount="1") => {
    const stakeKSMfromMoonriver = async ( originMoonriverAddress, destParachainId, _amount, destinationAccount) => {

      console.log(`************************* ==== > WE ARE INSIDE stakeKSMfromMoonriver`);
      return new Promise (async (resolve, reject) => {

            if (!polkadotInjector || !polkadotInjectorAddress) {
              console.log(`stakeKSMfromMoonriver polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`)
              resolve("Polkadot Extension Error Please Refresh Dapp");
              return;
            }

            if (Number(_amount)< 1.01) {
              console.log(`In order to stake KSM at Karura the minimum amount is 1 KSM plus XCM fees`);
              resolve("To stake KSM for LKSM the minimum amount is 1.01 KSM");
              return;
            }

            const parentValue = 1;
            const assetM = [];
            const assetMultilocation =[ parentValue, assetM];
            const amountWEI = new BN(_amount * mantissa12);
            // const amount = (new BN( Number(_amount) * mantissa12)).toString();
            const amount = amountWEI.toString();

            //multilocation
            const hexvalue = getAccountIdtoHex(destinationAccount)
            const nakedhexvalue = hexvalue.substring(2);
            const destParachainHex = `0000${numberToHex(Number(destParachainId)).substring(2)}`;
            const multilocation = [`0x00${destParachainHex}`,`0x01${nakedhexvalue}00`];
            const destination = [1,multilocation];
            
            //fees
            const weight = 4000000000;


            const {free: initialKSM , reserved: intialreserved, frozen: initialfrozen} = await KaruraApi.query.tokens.accounts(destinationAccount, {Token: "ksm" }); 
            // console.log(`Karura destinationAccount:${destinationAccount} freeKSM: ${initialKSM}`);
                
            //Stake KSM at Karura //actual fees
            const expectedFeesarrivingAtKarura =  new BN( 0.0001 * mantissa12 ); //actual fees 0.000077279003
            // console.log(`========> expectedFeesarrivingAtKarura: ${expectedFeesarrivingAtKarura}`);
            const amountWEI_toStake = amountWEI.sub(expectedFeesarrivingAtKarura);
            const txStakeKSM = await KaruraApi.tx.homa.mint( amountWEI_toStake )
            const txStakeKSM_Signed =  await txStakeKSM.signAsync(polkadotInjectorAddress, { signer: polkadotInjector.signer });
        

            const tx4 = await Xtokens.transfer_multiasset(assetMultilocation, amount, destination , weight);
            tx4.wait(3).then( async reslveMsg => {
              // initialKSM
              const {free: updatedKSM , reserved: updatedreserved, frozen: updatedfrozen} = await KaruraApi.query.tokens.accounts(destinationAccount, {Token: "ksm" }); 
              // console.log(`Karura destinationAccount:${destinationAccount} updatedKSM: ${updatedKSM}`);
              const netAmount = updatedKSM.sub(initialKSM);
              // console.log(`Karura destinationAccount:${destinationAccount} netAmount: ${netAmount}`);
              const feesPaidatDestinationChain = amountWEI.sub(netAmount);
              // console.log(`Karura destinationAccount:${destinationAccount} feesPaidatDestinationChain: ${feesPaidatDestinationChain}`);

              const txSendKSMMsg = 
                  [`Moonriver Transaction hash:${reslveMsg.transactionHash} .`, `Finalised at Block Hash: ${reslveMsg.blockHash} Block#: ${reslveMsg.blockNumber} gasUsed: ${reslveMsg.gasUsed}`,
                  `Sent ${_amount} KSM to Karura account ${destinationAccount}`, `Received ${ethers.utils.formatUnits(ethers.BigNumber.from(`${netAmount}`),12)} KSM`,
                  `Fees paid at destination: ${ethers.utils.formatUnits(ethers.BigNumber.from(`${feesPaidatDestinationChain}`),12)}`
                  ];
              // console.log(txSendKSMMsg);


                  //#region Ready to stake KSM
                  // console.log(`Sending transaction to stake KSM at Karura`);
                  txStakeKSM_Signed.send( async ({ status, events=[], dispatchError }) => {
                          console.log(`Current txStakeKSM_Signed status: `,status,` Current status is ${status.type}`);
                          
                          let errorInfo;
                          if (dispatchError) {
                            if (dispatchError.isModule) {
                              // for module errors, we have the section indexed, lookup
                              const decoded = KaruraApi.registry.findMetaError(dispatchError.asModule);
                              const { docs, name, section } = decoded;
                              errorInfo = `${section}.${name}`;
                              console.log(`txStakeKSM_Signed dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                            } else {
                              // Other, CannotLookup, BadOrigin, no extra info
                              errorInfo = dispatchError.toString();
                              console.log(`txStakeKSM_Signed dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
                            }
                          }
                          else console.log(`txStakeKSM_Signed ***** NO DISAPTCHEERROR *****: `);
            
                            
                          if (status.isFinalized) {
                            let KaruraExtrinsicResult, extrinsicIndexinBlock, KaruraExtrinsicHash;
                            
                            // Loop through all events
                            events.forEach(async ({ phase, event: { data, method, section } }) => {  
                                extrinsicIndexinBlock = phase.asApplyExtrinsic;
                                // console.log(`Staking KSM at Karura \t' ${phase}: ${section}.${method}:: ${data}`);
                                
                                if (method==="ExtrinsicSuccess") 
                                {
                                  KaruraExtrinsicResult = "Succeeded"; 
                                  
                                  const KaruraextrinsicBlockHash = status.asFinalized;
                                  const signedBlock = await KaruraApi.rpc.chain.getBlock(KaruraextrinsicBlockHash);
                                  signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                                    if (index===Number(extrinsicIndexinBlock)) KaruraExtrinsicHash = `${hash.toString()}`
                                  });
                                  // console.log(`Staking Extrinsic has succeeded`);
                                  const {free: freeLKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(destinationAccount, {Token: "lksm" }); 
                                  // console.log(`====> FREE LKSM ON KARURA: ${freeLKSM}`);
                                  const txStakingMsg = 
                                    [
                                    `Staking KSM at Karura Extrinsic hash: ${KaruraExtrinsicHash} .`,
                                    `Finalised at Block Hash: ${KaruraextrinsicBlockHash} .`,
                                    `Updated Free LKSM Balance: ${ethers.utils.formatUnits(ethers.BigNumber.from(`${freeLKSM}`),12)}`
                                    ];
                                  
                                  // console.log(txStakingMsg); 
                                  resolve([...txSendKSMMsg, ...txStakingMsg]);
                                }
                                else if (method==="ExtrinsicFailed") 
                                {
                                  KaruraExtrinsicResult = "Failed";   //txResult +="Extrisnic Failed";
                                  resolve(["Staking KSM action has failed"]);
                                }
                          });
            
                        }
                  });
                  //#endregion 

            });
      });

    }
    //#endregion 
        

    //#region Get Balance in Karura
    const getBalanceinKarura = async (accountAddress="", token="") => {
      // console.log(`getBalanceinKarura`);
      if (KaruraApi && accountAddress!=="" && token!=="")
      {
        const {free: freeBalance , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(accountAddress, {Token: token.toLowerCase() }); 
        const amount = `${ethers.utils.formatUnits(ethers.BigNumber.from(`${freeBalance}`),12)}`;
        // console.log(`KARURA Free Balance in ${token}: ${amount}`);
        return amount
      }
      else return "error in reading balance";
    };
    //#endregion 


    //#region ***** Unstaking KSM from LKS  at Karura //*****
    const unstakeKSMfromLKSM = async (_amount="") => {
      console.log(`Inside Unstaking LKSM`);
      return new Promise (async (resolve, reject) => {

          if (!polkadotInjector || !polkadotInjectorAddress) {
            console.log(`unstakeKSMfromLKSM polkadotInjector and/or polkadotInjectorAddress are null. Cannot proceed!!!`)
            return;
          }

          // const {free: freeLKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(accountAddress, {Token: "lksm" }); 
          // console.log(`====> UNSTAKE LKSM ON KARURA: ${freeLKSM}`);

          let amount;
          if (_amount==="") return;
          else amount = new BN(_amount * mantissa12);

          // await KaruraApi.tx.homa.requestRedeem(amount, true)
          const path = [{Token:"LKSM"},{Token: "KUSD"},{Token:"KSM"}];
          await KaruraApi.tx.dex.swapWithExactSupply(path , amount, 0)
          .signAndSend(polkadotInjectorAddress, { signer: polkadotInjector.signer }, ({ status, events, dispatchError }) => {
                let errorInfo;
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    // for module errors, we have the section indexed, lookup
                    const decoded = KaruraApi.registry.findMetaError(dispatchError.asModule);
                    const { docs, name, section } = decoded;
                    errorInfo = `${section}.${name}`;
                    console.log(`unstakeKSMfromLKSM dispatchError1 ${section}.${name}: ${docs.join(' ')}`);
                  } else {
                    // Other, CannotLookup, BadOrigin, no extra info
                    errorInfo = dispatchError.toString();
                    console.log(`unstakeKSMfromLKSM dispatchError2: `,dispatchError.toString()," errorInfo: ",errorInfo);
                  }
                }
                else console.log(`unstakeKSMfromLKSM ***** NO DISAPTCHEERROR *****: `);

                  
                if (status.isFinalized) 
                {
                  let KaruraExtrinsicResult, extrinsicIndexinBlock, KaruraExtrinsicHash;
                  // Loop through all events
                  events.forEach(async ({ phase, event: { data, method, section } }) => {  
                      extrinsicIndexinBlock = phase.asApplyExtrinsic;
                      // console.log(`UnStaking KSM at Karura \t' ${phase}: ${section}.${method}:: ${data}`);
                      
                      if (method==="ExtrinsicSuccess") 
                      {
                        KaruraExtrinsicResult = "Succeeded"; 
                        
                        const KaruraextrinsicBlockHash = status.asFinalized;
                        const signedBlock = await KaruraApi.rpc.chain.getBlock(KaruraextrinsicBlockHash);
                        signedBlock.block.extrinsics.forEach(({ hash, method: { method, section } }, index) => {
                          if (index===Number(extrinsicIndexinBlock)) KaruraExtrinsicHash = `${hash.toString()}`
                        });
                        // console.log(`UnStaking Extrinsic has succeeded`);
                        // const {free: freeLKSM , reserved: reserved1, frozen: frozen1} = await KaruraApi.query.tokens.accounts(polkadotInjector.address, {Token: "lksm" }); 
                        // console.log(`====> FREE LKSM ON KARURA: ${freeLKSM}`);
                        const freeLKSM = await getBalanceinKarura(polkadotInjectorAddress, "LKSM");

                        const txUnStakingMsg = 
                                [
                                  `Karura Extrinsic hash: ${KaruraExtrinsicHash}`,
                                  `Finalised at Block Hash: ${KaruraextrinsicBlockHash}`,
                                  `Updated Free LKSM Balance: ${freeLKSM}`
                                ];

                        // console.log(txUnStakingMsg); 
                        resolve(txUnStakingMsg);
                      }
                      else if (method==="ExtrinsicFailed") 
                      {
                        KaruraExtrinsicResult = "Failed";    
                        resolve("UnStaking KSM action has failed")
                      }
                  });

              }
          });

        });
    }

    //#endregion 

  //#endregion 













//#endregion 







export {
          setWallet,
          setApi,
          setPolkadotInjector,
          wallet,
          setup_SubstrateChain, 
          transferFromRelayToParachain, 
          transferFromParachainToRelay,
          tranferFromRelayToRelay,
          transfer_Currency_FromParachainToParachain,
          transfer_Asset_FromParachainToParachain,
          transfer_MultipleAssets_FromParachainToParachain,
          transfer_MOVR_FromParachainToParachain,
          transferFromPhalaToRelay,
          transferFromBasiliskToParachain,
          transfer_multiasset,
          transfer_xcKSMtoKSM,
          simpleERC20Transfer,
          getBalance,
          checkAllowanceOfTokentoAddress,
          approve,
          getAccountIdtoHex,
          getAvailableBalance,
          getAccountFormatsforAccountI32,
          
          stakeKSMfromKusama,
          unstakeKSMfromLKSM,
          getBalanceinKarura,

          stakeKSMfromKintsugi,
          stakeKSMfromMoonriver,

          rococo_transfer_Asset_FromParachainToParachain,
          rococo_transfer_currency,
          rococo_transfer_currencyWithFee,
          rococo_transfer_multiCurrencies,
          rococo_transfer_MultiAssetS_FromParachainToParachain,
          rococo_transfer_MultiAssetWithFee_FromParachainToParachain,
          getRococo_AvailableBalance,

       }