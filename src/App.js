import React, { Suspense, useEffect, useState, useCallback } from 'react';

import { ethers } from 'ethers';  
import { setApi, setWallet, setup_SubstrateChain, setPolkadotInjector, getAvailableBalance} from './Setup.js';   //Setup EVM and Polkadto Api

// import { web3Accounts, web3Enable, web3FromAddress, web3AccountsSubscribe, web3FromSource, web3ListRpcProviders, web3UseRpcProvider } from '@polkadot/extension-dapp';
import { web3Enable, web3FromAddress, web3AccountsSubscribe } from '@polkadot/extension-dapp';

import detectEthereumProvider from '@metamask/detect-provider'; // FOR METAMASK TO BE USED This function detects most providers injected at window.ethereum


/// Components
import Index from "./jsx";

import "./vendor/bootstrap-select/dist/css/bootstrap-select.min.css";
import "./css/style.css";
 

function App() {

  //#region
  const [relaySpecs,setRelaySpecs]              = useState({ api: undefined, chainID: undefined, blockNumber: undefined });
  const [parachainSpecs,setParachainSpecs]      = useState({ api: undefined, chainID: undefined, blockNumber: undefined });
  const [karuraAlphaSpecs,setKaruraAlphaSpecs]  = useState({ api: undefined, chainID: undefined, blockNumber: undefined });

  const [setupSpecs,setSetupSpecs]            = useState({ wallet: null, provider: null, pair: null, connected: "Not connected", walletAddress: null });
  const [blockHeader, setBlockHeader]         = useState({ number: undefined , hash: undefined, size: undefined });

  const [evm_api_state,setEvm_Api_State] = useState(false);
  const [accountList, setAccountList] = useState();  //stores the list of accounts from the extensions

  const [polkadtoAccountList, setPolkadtoAccountList] = useState([]);
  const [polakdotAccountSigner, setPolakdotAccountSigner] = useState({injector: null, address: null});
  //#endregion


  //#region PolkadotExtenionApp
  // const polakdotSignerfunction = async (SENDER) => {
  const polakdotSignerfunction = useCallback(async (SENDER) => {

      if (!SENDER) return null 
      else {
          const injector = await web3FromAddress(SENDER); // finds an injector for an address
          console.log(`polakdotSigner ===> injector: `,injector);
          // setPolakdotSigner(injector);
          setPolkadotInjector(injector,SENDER);
          setPolakdotAccountSigner({injector: injector, address: SENDER});
          return injector;    
      }
  },[]);

  useEffect( () => {
    const enbalePolakdotExt = async () => { 
        //this call fires up the authorization popup returns an array of all the injected sources (this needs to be called first, before other requests)
        const extensions = await web3Enable('ntt54 Dapp');
        if (extensions.length === 0) {
          console.log("no extension installed, or the user did not accept the authorization");
          // in this case we should inform the user and give a link to the extension
          return;
        }

        await web3AccountsSubscribe(( injectedAccounts ) => { 
            let substrateAccounts = []
            injectedAccounts.map(( account ) => substrateAccounts.push(account.address));
            setPolkadtoAccountList(substrateAccounts);
        });

    };
    enbalePolakdotExt();

  }, []);   
  //#endregion


  //#region MetaMaskExtenionApp
  // useEffect(() => {

  //   const enableMetamaskManagement = async () => {

  //         let provider, mm_wallet, mm_acounts, mm_account, mm_chainId ;

  //         //#region SETUP PROVIDER AND WALLET WITH METAMASK 
  //         const _provider = await detectEthereumProvider();
  //         if (_provider) {
  //             provider = new ethers.providers.Web3Provider(window.ethereum, "any");   

  //             mm_acounts = await _provider.request({ method: 'eth_requestAccounts' });
  //             mm_chainId = await _provider.request({ method: 'eth_chainId' });
  //             mm_account = mm_acounts[0];
  //             mm_wallet = provider.getSigner(); 
  //             console.log(`***** MetaMask Accounts *****: `,mm_acounts, ` CHAINID: ${mm_chainId} SELECTED ACOUNT: ${mm_account} mm_wallet: `,mm_wallet);
              
  //             setEvm_Api_State(true);
  //             setAccountList(mm_acounts);
  //             setWallet(mm_wallet);
  //             const _setupSpecs = { wallet: mm_wallet, provider, pair:"", connected: "C", walletAddress: await mm_wallet.getAddress() };
  //             setSetupSpecs(_setupSpecs);

  //             _provider.on('chainChanged', async (chainId) => {
  //               window.location.reload();
  //               const mm_chainId = await _provider.request({ method: 'eth_chainId' });
  //               console.log(`***** MetaMask Accounts *****:  CHAINID: ${mm_chainId`z}`);
  //             });

  //             _provider.on('accountsChanged', async (accounts) => {
  //               // Handle the new accounts, or lack thereof. // "accounts" will always be an array, but it can be empty.
  //               mm_account = accounts[0];

  //               provider = new ethers.providers.Web3Provider(window.ethereum, "any");   
  //               mm_wallet = provider.getSigner(); 
  //               console.log(`****** METAMASK ACCOUNT CHANGED EVENT KICKS IN *****  accounts: `,accounts,`  SELECTED ACOUNT: ${mm_account} mm_wallet.getAddress: ${await mm_wallet.getAddress()} mm_wallet: `,mm_wallet);
                
  //               setEvm_Api_State(true);
  //               setAccountList(accounts);
  //               setWallet(mm_wallet);

  //               const _setupSpecs = { wallet: mm_wallet, provider, pair:"", connected: "C", walletAddress: await mm_wallet.getAddress() };
  //               setSetupSpecs(_setupSpecs);

  //             });

  //         } 
  //         else { 
  //           console.log('Please install MetaMask!'); 
  //           // return { provider: null, wallet: null, account: null };
  //         }
  //         //#endregion SETUP PROVIDER AND WALLET WITH METAMASK 
   
  //   };
  //   enableMetamaskManagement();

  // }, []);   
  //#endregion




  useEffect(() => {
    const runSetup = async () => {
      console.log("api_rel running setup ");

        //#region Substrate
        //mainnet
        const { api: api_kusama } = await setup_SubstrateChain("Kusama");
        // console.log("api_kusama: ",api_kusama);
        setApi("Kusama", api_kusama);

        // const { api: api_moonriver } = await setup_SubstrateChain("Moonriver");
        // // console.log("api_moonriver: ",api_moonriver);
        // setApi("Moonriver", api_moonriver);

        const { api: api_karura } = await setup_SubstrateChain("Karura");
        // console.log("api_karura: ",api_karura);
        setApi("Karura", api_karura);

        // const { api: api_kintsugi } = await setup_SubstrateChain("Kintsugi");
        // // console.log("api_kintsugi: ",api_kintsugi);
        // setApi("Kintsugi", api_kintsugi);

        // const { api: api_phala } = await setup_SubstrateChain("Phala");
        // // console.log("api_phala: ",api_phala);
        // setApi("Phala", api_phala);


        // const { api: api_Rococo_Karura } = await setup_SubstrateChain("Rococo_Karura");
        // // console.log("api_Rococo_Karura: ",api_Rococo_Karura);
        // setApi("Rococo_Karura", api_Rococo_Karura);

        const { api: api_Basilisk } = await setup_SubstrateChain("Basilisk");
        // console.log("api_Rococo_Basilisk: ",api_Rococo_Basilisk);
        setApi("Basilisk", api_Basilisk);

        // const { api: api_Rococo_Phala } = await setup_SubstrateChain("Rococo_Phala");
        // // console.log("api_Rococo_Phala: ",api_Rococo_Phala);
        // setApi("Rococo_Phala", api_Rococo_Phala);

        console.log("api_kusama.consts.balances.existentialDeposit : ",api_kusama.consts.balances.existentialDeposit.toString());             
        // console.log("api_moonriver.consts.balances.existentialDeposit : ",api_moonriver.consts.balances.existentialDeposit.toNumber());            
        console.log("api_karura.consts.balances.existentialDeposit : ",api_karura.consts.balances.existentialDeposit.toNumber());             

        setRelaySpecs({ api: api_kusama, chainID: undefined, blockNumber: undefined });
        // setParachainSpecs({ api: api_moonriver, chainID: undefined, blockNumber: undefined });
        setKaruraAlphaSpecs({ api: api_karura, chainID: undefined, blockNumber: undefined });
        //#endregion
    }
    runSetup();

  }, []);   


  //#region  parachain events setup
  useEffect(() => {

    const parachain = async (api) => {
        // const chain = await api.rpc.system.chain();
        // console.log(`App.js Parachain ${chain} is run at  Timestmap: ${new Date()}`);
        
        //Subscribe to the new headers on-chain.   
        await api.rpc.chain.subscribeNewHeads((lastHeader) => {

            // console.log(`${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}`);
            setBlockHeader({number: `${lastHeader.number}`, hash: `lastHeader.hash`, size: "header.size"});

        });
    }

    if (parachainSpecs.api)
    {
      // parachain(parachainSpecs.api).catch((er) => { console.log(`APP.JS parachain Error: `,er);  });
    }
    else console.log(`App.js => setupSpecs.provider is undefined`);

  }, [parachainSpecs.api]);  
  //#endregion  parachain events setup

    
  return (
    <>
              <Suspense fallback={
                  <div id="preloader">
                      <div className="sk-three-bounce">
                          <div className="sk-child sk-bounce1"></div>
                          <div className="sk-child sk-bounce2"></div>
                          <div className="sk-child sk-bounce3"></div>
                      </div>
                  </div>  
                 }
              >  
                  <Index 
                    setupSpecs={setupSpecs} polakdotSignerfunction={polakdotSignerfunction} polkadtoAccountList={polkadtoAccountList} 
                    relaySpecs={relaySpecs} karuraAlphaSpecs={karuraAlphaSpecs}  accountList={accountList} blockHeader={blockHeader}   
                    polakdotAccountSigner={polakdotAccountSigner} evm_api_state={"evm_api_state"} 
                  />
              </Suspense>
          </>
      );

}

export default App;
