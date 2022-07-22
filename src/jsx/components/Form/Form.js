import { useCallback, useEffect, useMemo, useState } from "react"
import Select from "react-select"
import './Form.css'

export const chainOptions = [
  { 
    value: 'Kusama', 
    label: 'Kusama', 
    allowedChains: ['Basilisk', 'Karura'],
    allowedTokens: {
      // from elsewhere to Kusama
      from: {
        'Basilisk': ['KSM'],
        'Karura': ['KSM'],
      },
      // to elsewhere from Kusama
      to: {
        'Basilisk': ['KSM'],
        'Karura': ['KSM'],
      },
    }
  },
  { 
    value: 'Karura', 
    label: 'Karura', 
    allowedChains: ['Basilisk', 'Kusama'],
    allowedTokens: {
      from: {
        'Basilisk': ['aUSD', 'BSX'],
        'Kusama': ['KSM'],
      },
      to: {
        'Basilisk': ['aUSD', 'BSX'],
        'Kusama': ['KSM'],
      },
    }
  },
  { 
    value: 'Basilisk', 
    label: 'Basilisk', 
    allowedChains: ['Kusama', 'Karura'],
    allowedTokens: {
      from: {
        'Karura': ['aUSD', 'BSX'],
        'Kusama': ['KSM'],
      },
      to: {
        'Karura': ['aUSD', 'BSX'],
        'Kusama': ['KSM'],
      },
    }
  }
];

export const assetOptions = [
  {
    value: 'BSX',
    label: 'BSX',
  },
  {
    value: 'aUSD',
    label: 'aUSD',
  },
  {
    value: 'KSM',
    label: 'KSM',
  },
];

export const Form = ({
  onOriginChainSelected,
  onDestinationChainSelected,
  onAssetSelected
}) => {
  const [form, setForm] = useState({
    fromChain: { value: 'Kusama', label: 'Kusama'},
    toChain: null,
    asset: { value: 'KSM', label: 'KSM' }
  })
  
  const handleFromChainChange = useCallback((fromChain) => {
    fromChain = chainOptions.find(chain => chain.value == fromChain.value);

    setForm(form => {
      const toChain = chainOptions.find(chain => form.toChain && chain.value == form.toChain.value);
      const resetToChain = fromChain && toChain && !fromChain.allowedChains.includes(toChain.value);
      
      if (!toChain || !fromChain) return {
        ...form,
        fromChain
      }

      const resetAsset = !(
        form.asset
        && fromChain.allowedTokens.to[toChain.value]
        && fromChain.allowedTokens.to[toChain.value].includes(form.asset.value)
        && toChain.allowedTokens.from[fromChain.value]
        && toChain.allowedTokens.from[fromChain.value].includes(form.asset.value)
      );

      console.log('handleFromChainChange', {
        fromChain,
        resetToChain,
        resetAsset
      });

      return {
        ...form,
        fromChain,
        toChain: resetToChain ? null : form.toChain,
        asset: resetAsset ? null : form.asset
      };
    })
  }, []);

  const handleToChainChange = useCallback((toChain) => {
    toChain = chainOptions.find(chain => chain.value == toChain.value);

    setForm(form => {
      const fromChain = chainOptions.find(chain => form.fromChain && chain.value == form.fromChain.value);
      const resetFromChain = fromChain && !toChain.allowedChains.includes(fromChain.value);
    
      if (!toChain || !fromChain) return {
        ...form,
        toChain
      }

      const resetAsset = !(
        form.asset
        && toChain.allowedTokens.from[fromChain.value]
        && toChain.allowedTokens.from[fromChain.value].includes(form.asset.value)
        && fromChain.allowedTokens.to[toChain.value]
        && fromChain.allowedTokens.to[toChain.value].includes(form.asset.value)
      );

      console.log('handleToChainChange', {
        toChain,
        fromChain,
        asset: form.asset,
        resetAsset,
        resetFromChain
      })

      return {
        ...form,
        toChain,
        fromChain: resetFromChain ? null : form.fromChain,
        asset: resetAsset ? null : form.asset
      };
    })
  }, []);

  const optionsFrom = useMemo(() => chainOptions, []);
  const optionsTo = useMemo(() => chainOptions, []);
  const optionsAssets = useMemo(() => assetOptions, []);

  const handleSwitchChainsClick = useCallback(() => {
    setForm(form => ({
      ...form,
      fromChain: form.toChain,
      toChain: form.fromChain
    }));
  }, []);

  const handleAssetChange = useCallback((asset) => {
    setForm(form => {
      const toChain = chainOptions.find(chain => form.toChain && chain.value == form.toChain.value);
      const fromChain = chainOptions.find(chain => form.fromChain && chain.value == form.fromChain.value);

      // const resetFromChain = (
      //   // doesnt make sense to validate 'from' tokens without knowing where they are going
      //   // so we dont reset the asset unless both chains are selected
      //   toChain
      //   && fromChain.allowedTokens.to[toChain.value].includes(form.asset && form.asset.value)
      //   || toChain && toChain.allowedTokens.from[fromChain.value].includes(form.asset && form.asset.value)
      // );

      if (!fromChain || !toChain) return {
        ...form,
        asset
      }

      // TODO: check if any any other 'to' can be used to send the asset, 
      const resetFromChain = !(
        fromChain
        && toChain
        && fromChain.allowedTokens.to[toChain.value]
        && fromChain.allowedTokens.to[toChain.value].includes(asset.value)
      );

      // const resetToChain = (
      //   // doesnt make sense to validate 'from' tokens without knowing where they are going
      //   // so we dont reset the asset unless both chains are selected
      //   toChain
      //   && toChain.allowedTokens.from[fromChain.value].includes(form.asset && form.asset.value)
      //   || fromChain && fromChain.allowedTokens.to[toChain.value].includes(form.asset && form.asset.value)
      // )
      
      // TODO: check if any any other 'from' can be used to send the asset, same for 'to'
      const resetToChain = !(
        fromChain
        && toChain
        && toChain.allowedTokens.from[fromChain.value]
        && toChain.allowedTokens.from[fromChain.value].includes(asset.value)
        // && fromChain.allowedChains.to[toChain.value]
        // && fromChain.allowedChains.to[toChain.value].includes(form.asset)
      );

      console.log('handleAssetChange', {
        resetFromChain,
        resetToChain
      })

      return {
        ...form,
        fromChain: resetFromChain ? null : form.fromChain,
        toChain: resetToChain ? null : form.toChain,
        asset
      };
    })
  }, []);

  // TODO: we can allow selecting an option which was meant to be disabled, but it should reset either from or to chains
  const isOptionDisabled = useCallback((option) => {
    const toChain = chainOptions.find(chain => form.toChain && chain.value == form.toChain.value);
    const fromChain = chainOptions.find(chain => form.fromChain && chain.value == form.fromChain.value);
    
    console.log('isOptionDisabled', { fromChain, toChain });

    if (!fromChain || !toChain) return false;

    const isOptionDisabledFrom = fromChain
      ? !(toChain
        && fromChain.allowedTokens.to[toChain.value]
        && fromChain.allowedTokens.to[toChain.value].includes(option.value))
      : false
    
    const isOptionDisabledTo = toChain
    ? !(fromChain
      && toChain.allowedTokens.from[fromChain.value]
      && toChain.allowedTokens.from[fromChain.value].includes(option.value))
    : false

    console.log('isOptionDisabled', {
      isOptionDisabledFrom,
      isOptionDisabledTo,
      value: option.value
    })

    const isOptionDisabled = isOptionDisabledFrom || isOptionDisabledTo;

    return isOptionDisabled;
  }, [form]);

  useEffect(() => {
    onOriginChainSelected(form.fromChain && form.fromChain.value);
    onDestinationChainSelected(form.toChain && form.toChain.value);
    onAssetSelected(form.asset && form.asset.value);
  }, [form]);

  return (
    <div className="container-fluid chain-selector">
      <div className="row">
        {/* Origin chain */}
        <div className="col">
          <div className="row g-0">
            <div className="col-12">
              Origin chain
            </div>
            <div className="row g-0">
              <div className="col-12">
              <Select
                placeholder={"Select origin chain"}
                value={form.fromChain}
                onChange={handleFromChainChange}
                options={optionsFrom}
              ></Select>
              </div>
            </div>
          </div>
        </div>
        <div className="col-1 ">
          <div className="asset-switcher">
            <button onClick={() => handleSwitchChainsClick()}>Switch</button>
          </div>
        </div>
        {/* Destination chain */}
        <div className="col">
          <div className="row g-0">
            <div className="col-12">
              Destination chain
            </div>
            <div className="row g-0">
              <div className="col-12">
              <Select
                placeholder={"Select destination chain"}
                value={form.toChain}
                onChange={handleToChainChange}
                options={optionsTo}
              ></Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row asset-selector">
        <div className="col">
          <div className="row g-0">
            <div className="col-12">
              <Select
                placeholder={"Select asset"}
                value={form.asset}
                onChange={handleAssetChange}
                options={assetOptions}
                isOptionDisabled={isOptionDisabled}
              ></Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}