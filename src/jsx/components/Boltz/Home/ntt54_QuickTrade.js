import React,{useState,useEffect,  useCallback} from 'react';
import { 
			wallet, getBalance, 
			transferFromRelayToParachain, transferFromParachainToRelay, transferFromPhalaToRelay, tranferFromRelayToRelay, 
			transfer_Asset_FromParachainToParachain, transferFromBasiliskToParachain, transfer_MultipleAssets_FromParachainToParachain,
			simpleERC20Transfer, getAccountFormatsforAccountI32,
			transfer_xcKSMtoKSM, transfer_multiasset, transfer_Currency_FromParachainToParachain, transfer_MOVR_FromParachainToParachain,
			stakeKSMfromKusama, unstakeKSMfromLKSM, getBalanceinKarura, stakeKSMfromMoonriver, stakeKSMfromKintsugi,
			rococo_transfer_Asset_FromParachainToParachain, rococo_transfer_currency, rococo_transfer_currencyWithFee, rococo_transfer_multiCurrencies, 
			rococo_transfer_MultiAssetS_FromParachainToParachain, rococo_transfer_MultiAssetWithFee_FromParachainToParachain,
	   } from '../../../../Setup.js';



//#region xcmRputes schema  Token=> OriginChain => ArrayOfTragetChains
const xcmRoutes = {
					 "KSM": {
								"Kusama"   : ["Moonriver", "Karura"   , "Kintsugi", "Phala"],	
								"Moonriver": ["Kusama"   , "Karura"   , "Kintsugi", "Phala"], 
								"Karura"   : ["Kusama"   , "Moonriver", "Kintsugi", "Phala"  ], 
								"Kintsugi" : ["Kusama"   , "Moonriver", "Karura"  , "Phala"], 
								"Phala"    : ["Kusama"], 
							},
					 "KAR": {
								"Karura"   : ["Moonriver", "Phala"],
								"Moonriver": ["Karura",  "Phala"],                   //Can KAR go from Moonriver to Kintsugi directly without going via Karura?
								"Kintsugi" : [], 
								"Phala"    : ["Karura"], 
							},
					 "AUSD": {
								"Karura"   : ["Moonriver", "Phala"],
								"Moonriver": ["Karura"   , "Phala"], 
								"Phala"    : ["Karura"],
							 },
					"KINT": {
						        "Kintsugi" : ["Karura", "Moonriver"], 
								"Karura"   : ["Kintsugi", "Moonriver"],
								"Moonriver": ["Kintsugi", "Karura"], 
							 },
					"KBTC": {
						        "Kintsugi" : ["Karura", "Moonriver"], 
								"Karura"   : ["Kintsugi", "Moonriver"],
								"Moonriver": ["Kintsugi"], 
							 },
					"PHA": {
								"Phala"    : ["Karura", "Moonriver", "Basilisk"], 
								"Karura"   : ["Phala", "Moonriver"],
								"Moonriver": ["Phala", "Karura"], 

								"Basilisk" : ["Phala"], 
							 },
					"MOVR": {
								"Moonriver": ["Karura", "Phala"], 
								"Karura"   : ["Moonriver"],
								"Phala"    : ["Moonriver"], 
							 },

					"BSX": {
						        "Basilisk" : ["Karura", "Phala"], 
								"Karura"   : ["Basilisk","Phala"],      
								"Phala"	   : ["Basilisk","Karura"], 
							 }
				};
//#endregion

//#region parachainCodes tokenList

const parachainCodes = {   
							//mainnets
							Moonriver: 2023,   
							Karura   : 2000,
							Kintsugi : 2092,
							Phala    : 2004,
							Basilisk : 2090,
							//testsnets 
							MoonbaseAlpha   : 1000,
							KaruraAlphanet  : 2000,
							Karura_Rococo   : "r2000",
							Rhala_Rococo    : "r2004",
							Basilisk_Rococo : "r2090"
						}	
						
const tokenList = ["KSM","KAR","AUSD","KINT","KBTC","PHA","MOVR","BSX"];
//#endregion



const QuickTrade = ({ 
	targetAccount, setupSpecs, relaySpecs, karuraAlphaSpecs, blockHeader, accountList, polakdotAccountSigner, 
	destinationChainSelected, originChainSelected, tokenSelected, resetAll,
	availableAmountToTransfer, accountFormats, selectedAction, getAllBalancesAndAccountFormats, getROCOCO_AllBalancesAndAccountFormats,
}) => {
	
    const [inputTranferAmount, setInputTranferAmount] = useState("");
	const [sendToAddress, setSendToAddress] = useState("");	
	const [transfer_IsSubmiting, setTransfer_IsSubmiting] = useState(false);
    const [transactionMessage, setTransactionMessage] = useState("");
    const [suggestedOriginAccount, setSuggestedOriginAccount] = useState("");

	const relayTokenPrecompileAddress = "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080";  //xcUNIT or xcKSM

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (relaySpecs.api && karuraAlphaSpecs.api) {
			setLoading(false);
		}
	}, [relaySpecs, karuraAlphaSpecs])

	useEffect(() => {
		if (accountFormats)
		{
			if (originChainSelected==="Kusama") setSuggestedOriginAccount(accountFormats.kusama_Address);
			else if (originChainSelected==="Karura") setSuggestedOriginAccount(accountFormats.karura_Address);
			else if (originChainSelected==="Kintsugi") setSuggestedOriginAccount(accountFormats.kintsugi_Address);
			else if (originChainSelected==="Phala") setSuggestedOriginAccount(accountFormats.khala_Address);
			else if (originChainSelected==="Basilisk") setSuggestedOriginAccount(accountFormats.basilisk_Address);
			else setSuggestedOriginAccount("");
		}
		 
	}, [originChainSelected, polakdotAccountSigner]);

	useEffect(() => {  
		let account_formats = accountFormats;
		if (originChainSelected==="Moonriver") account_formats = getAccountFormatsforAccountI32(polakdotAccountSigner.address);

		if (destinationChainSelected==="Kusama") setSendToAddress(account_formats.kusama_Address);
		else if (destinationChainSelected==="Karura") setSendToAddress(account_formats.karura_Address);
		else if (destinationChainSelected==="Kintsugi") setSendToAddress(account_formats.kintsugi_Address);
		else if (destinationChainSelected==="Phala") setSendToAddress(account_formats.khala_Address);
		else if (destinationChainSelected==="Moonriver") setSendToAddress(accountList[0]);
		else if (destinationChainSelected==="Basilisk") setSendToAddress(account_formats.basilisk_Address);
		else setSendToAddress("");

	}, [destinationChainSelected, polakdotAccountSigner]);

	useEffect(() => {  
		setInputTranferAmount(availableAmountToTransfer);
	}, [availableAmountToTransfer]);

	useEffect(() => {  
		const getLKSbalance = async () => {
			if(selectedAction==="unstakeKSMfromLKSMatKarura") 
			{
			   const availableBalanceLKSM = await getBalanceinKarura(polakdotAccountSigner.address, "LKSM");
			   setInputTranferAmount(availableBalanceLKSM);
			}
		}
		getLKSbalance();
	}, [selectedAction, polakdotAccountSigner]);


	//#region transferBalance
	const transferBalance = async (token, originChain, targetChain) => {
		// console.log(`XCMTransfer Begins transferBalance baseCurrency: `,baseCurrency,` sendToAddress: `,sendToAddress,`  inputTranferAmount: `,inputTranferAmount, ` OrginChain: ${destination} TargetChain:${targetChainDestination}`);
		const amount = inputTranferAmount.toString();
		const baseCurrency = token;
		const orginChain = originChain;
		const targetChainDestination = targetChain;
		// console.log(`ntt54_QuickTrade.js transferBalance => selectedAction: ${selectedAction}`);
		console.log(`XCMTransfer Begins transferBalance baseCurrency: `,baseCurrency,` sendToAddress: `,sendToAddress,`  inputTranferAmount: `,inputTranferAmount, ` orginChain: ${orginChain} targetChainDestination:${targetChainDestination}`);
		console.log('xcm debug', {
			amount, sendToAddress,
			setupSpecs: setupSpecs.wallet,
			relaySpecs,
			karuraAlphaSpecs,
			baseCurrency,
			originChain,
			targetChainDestination,
			originChain,
			targetChainDestination
		})

		if (amount!=="0" && sendToAddress!=="" && relaySpecs.api && karuraAlphaSpecs.api)
		{			 
					//#region XCM Transfers
					//#region baseCurrency KSM
					if (baseCurrency==="KSM")
					{
						//#region Origin Kusama
						if (orginChain==="Kusama" && targetChainDestination==="Karura")
						{
							console.log(`We are sending KSM from Kusama to Karura inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer KSM from Kusama to Karura, submitted.`);

							transferFromRelayToParachain(relaySpecs.api, parachainCodes.Karura, sendToAddress, amount)
								.then((resolveMsg) => {
									setTransactionMessage(
											resolveMsg.map((msg, index) => {
												return ( <p key={index}>{msg}</p> )
											})
									);
	
									getAllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]);
								})
								.catch((rejectMsg) => console.log(rejectMsg));

							setTransfer_IsSubmiting(false);
							setInputTranferAmount("");  resetAll();
						} else if (orginChain==="Kusama" && targetChainDestination==="Basilisk")
						{
							console.log(`We are sending KSM from Kusama to Basilisk inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer KSM from Kusama to Basilisk, submitted.`);

							transferFromRelayToParachain(relaySpecs.api, parachainCodes.Basilisk, sendToAddress, amount)
								.then((resolveMsg) => {
									setTransactionMessage(
											resolveMsg.map((msg, index) => {
												return ( <p key={index}>{msg}</p> )
											})
									);
	
									getAllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]);
								})
								.catch((rejectMsg) => console.log(rejectMsg));

							setTransfer_IsSubmiting(false);
							setInputTranferAmount("");  resetAll();
						} else if (orginChain==="Basilisk" && targetChainDestination==="Kusama")
						{
							console.log(`We are sending KSM from Basilisk to Kusama inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer KSM from Basilisk to Kusama, submitted.`);

							transferFromParachainToRelay("Basilisk", sendToAddress, amount)
								.then((resolveMsg) => {
									setTransactionMessage(
											resolveMsg.map((msg, index) => {
												return ( <p key={index}>{msg}</p> )
											})
									);
	
									getAllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]);
								})
								.catch((rejectMsg) => console.log(rejectMsg));

							setTransfer_IsSubmiting(false);
							setInputTranferAmount("");  resetAll();
						} else if (orginChain==="Karura" && targetChainDestination==="Kusama")
						{
							console.log(`We are sending KSM from Karura to Kusama inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer KSM from Karura to Kusama, submitted.`);

							transferFromParachainToRelay("Karura", sendToAddress, amount)
								.then((resolveMsg) => {
									setTransactionMessage(
											resolveMsg.map((msg, index) => {
												return ( <p key={index}>{msg}</p> )
											})
									);
	
									getAllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]);
								})
								.catch((rejectMsg) => console.log(rejectMsg));

							setTransfer_IsSubmiting(false);
							setInputTranferAmount("");  resetAll();
						}

						//#endregion
					}
					//#endregion

					//#region baseCurrency AUSD
					else if (baseCurrency==="AUSD")
					{
						if (orginChain==="Karura" && targetChainDestination==="Basilisk")
						{
							// console.log(`We are sending AUSD from Karura to Phala inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer AUSD from Karura to Basilisk, submitted.`);

							transfer_Asset_FromParachainToParachain("KUSD", parachainCodes.Karura, parachainCodes.Basilisk, sendToAddress, amount)
							.then((resolveMsg) => {
								setTransactionMessage(
										resolveMsg.map((msg, index) => {
											return ( <p key={index}>{msg}</p> )
										})
								);

								getAllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]);
							})
							.catch((rejectMsg) => console.log(rejectMsg));

							setTransfer_IsSubmiting(false);
							setInputTranferAmount("");  resetAll();
						}
						else if (orginChain==="Basilisk" && targetChainDestination==="Karura")
						{
							// console.log(`We are sending AUSD from Phala to Karura inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer AUSD from Basilisk to Karura, submitted.`);

							transferFromBasiliskToParachain("KUSD", parachainCodes.Karura, parachainCodes.Karura, sendToAddress, amount)
							.then((resolveMsg) => {
								setTransactionMessage(
										resolveMsg.map((msg, index) => {
											return ( <p key={index}>{msg}</p> )
										})
								);

								getAllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]);
							})
							.catch((rejectMsg) => console.log(rejectMsg));
							
							setTransfer_IsSubmiting(false);
							setInputTranferAmount("");  resetAll();
						}
					}

					//#endregion

					//#region baseCurrency BSX
					else if (baseCurrency==="BSX")
					{
						if (orginChain==="Karura" && targetChainDestination==="Basilisk")
						{
							console.log(`We are sending BSX from Basilisk to Phala inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer BSX from Basilisk to Phala, submitted.`);

							rococo_transfer_Asset_FromParachainToParachain("BSX", parachainCodes.Basilisk_Rococo, parachainCodes.Phala, sendToAddress, amount)
							.then((resolveMsg) => {
								setTransactionMessage(
										resolveMsg.map((msg, index) => {
											return ( <p key={index}>{msg}</p> )
										})
								);

								setTimeout(() => { getROCOCO_AllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]); },10000);
								setTransfer_IsSubmiting(false);
								setInputTranferAmount("");  resetAll();
							})
							.catch((rejectMsg) => console.log(rejectMsg));

						}
						else if (orginChain==="Basilisk" && targetChainDestination==="Karura")
						{
							console.log(`We are sending BSX from Basilisk to Karura inputTranferAmount:${amount} sendToAddress:${sendToAddress}`);
							setTransfer_IsSubmiting(true);
							setTransactionMessage(`Transfer BSX from Basilisk to Karura, submitted.`);

							// Equivalent for Kusama UI
							// transfer_Asset_FromParachainToParachain("BSX", parachainCodes.Basilisk_Rococo, parachainCodes.Karura, sendToAddress, amount)

							//Alternative Method1 *** tranfer ***/
							rococo_transfer_currency("BSX", parachainCodes.Karura, sendToAddress, amount)

							//Alternative Method2 *** tranferWithFee ***/
							// rococo_transfer_currencyWithFee("BSX", parachainCodes.Karura, sendToAddress, amount, 1)

							//Alternative Method3 *** tranferMultiCurrencies ***/
							// rococo_transfer_multiCurrencies("BSX", parachainCodes.Karura, sendToAddress, amount)

							//Alternative Method4 *** tranferMultiAssets ***/
							// rococo_transfer_MultiAssetS_FromParachainToParachain("BSX", parachainCodes.Basilisk_Rococo, parachainCodes.Karura, sendToAddress, amount)

							//Alternative Method5 *** tranferMultiAssetWithFee ***/
							// rococo_transfer_MultiAssetWithFee_FromParachainToParachain("BSX", parachainCodes.Basilisk_Rococo, parachainCodes.Karura, sendToAddress, amount, 1)

							//Alternative Method0 *** tranferMultiAsset ***/
							// rococo_transfer_Asset_FromParachainToParachain("BSX", parachainCodes.Basilisk_Rococo, parachainCodes.Karura, sendToAddress, amount)
							.then((resolveMsg) => {
								setTransactionMessage(
										resolveMsg.map((msg, index) => {
											return ( <p key={index}>{msg}</p> )
										})
								);

								setTimeout(() => { getROCOCO_AllBalancesAndAccountFormats(polakdotAccountSigner.address, accountList[0]); },10000);
								setTransfer_IsSubmiting(false);
								setInputTranferAmount("");  resetAll();
							})
							.catch((rejectMsg) => console.log(rejectMsg));
						}

			}
			//#endregion


			//#endregion
			
		
		}

		setSendToAddress("");
	};
	//#endregion


	//#region xcmTokenDiv
	const xcmTokenDiv =   (
		<div className="form-group">
			<div className="input-group input-group-lg">
				<div className="input-group-prepend" >
					<div className="input-group-text form-control default-select  "  style={{fontSize:"22px", textAlign:"center"}}>{tokenSelected}</div>
				</div>
				<div>
					<input type="text" className="form-control" value={inputTranferAmount} placeholder={"Number of tokens to send"} onChange = {(event) => setInputTranferAmount( event.target.value) } style={{color:"white", width:"450px" }} />
				</div>

			</div>
		</div>
	);
	//#endregion

	//#region tokenDiv
	const tokenDiv =   (
			<div className="form-group">
				<div className="input-group input-group-lg">
					<div className="input-group-prepend">
						<div className="input-group-text form-control default-select  "  style={{fontSize:"22px", textAlign:"center"}}>{originChainSelected}</div>
					</div>
					<input type="text" className="form-control"  readOnly
					value={`${originChainSelected==="Moonriver"? accountList[0] : (suggestedOriginAccount!==""? suggestedOriginAccount : polakdotAccountSigner.address) }`}   
					style={{color:"white", fontSize:"22px"}} />
				</div>
			</div>
						);
	//#endregion

	//#region stableDiv
	const stableDiv =   (			
			<div className="form-group">
				<div className="input-group input-group-lg">
					<div className="input-group-prepend">
							<div className="input-group-text form-control default-select  "  style={{fontSize:"22px", textAlign:"center"}}>{destinationChainSelected}</div>
					</div>
					<input type="text" className="form-control" value={sendToAddress} placeholder={"Destination Account Address"} onChange = {(event) => {
							setSendToAddress(event.target.value);
						}
					} style={{ color: "white"}} />
				</div>
			</div>
						);
	//#endregion

	//#endregion

	 
	useEffect(() => {
		if (targetAccount==="") setSendToAddress("");
	},[targetAccount]);
    

	return(
		<>
			<div className="card" style={{backgroundColor:"black"}}>
				<div className="card-header d-block ">
					<div>
						<h4 className="fs-36 text-black"  style={{textAlign:"center"}}>XCM Transfer Center</h4>
						<p>{loading ? 'loading': 'loaded'}</p>
					</div>
				</div>
				<div className="card-body">
					<div className="basic-form">
						<form className="form-wrapper">
							<div>
								{xcmTokenDiv}
							</div>
							<div style={{marginTop:"20px"}}>
								<div className="row" style={{marginBottom:"10px"}}>
									<div className="col-xl-9 col-xxl-12"></div>
									<div className="col-xl-3 col-xxl-12">
									</div>
								</div>

								{tokenDiv}
							</div>

							<div style={{marginTop:"20px"}}>
								<div className="row" style={{marginBottom:"10px"}}>
									<div className="col-xl-9 col-xxl-12"></div>
									<div className="col-xl-3 col-xxl-12">
									</div>
								</div>

								{stableDiv}
							</div>

							<div className="row mt-4"  style={{backgroundColor:"",  }}>
									<div className="col-xl-3"   >
									</div>
									<div className="col-xl-6"  style={{marginTop:"20px", backgroundColor:""}}>
											<button type="button" className="btn btn-outline-primary btn-lg btn-block" disabled={transfer_IsSubmiting || loading}   onClick = {() => transferBalance(tokenSelected, originChainSelected, destinationChainSelected) }>SEND IT</button> 
									</div>
							</div>
							<br/>
							<br/>
							<br/>
							<br/>
							<br/>
							<div className="col-xl-12 text-center text-warning" >
								<div className="fs-14 text-center mt-2" style={{color:"darkorange"}}>{transactionMessage}</div>
							</div>
							<br/>
							<br/>
						</form>
					</div>
				</div>
			</div>
		</>
	)
}
export default QuickTrade;