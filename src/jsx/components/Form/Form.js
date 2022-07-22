import { useCallback, useEffect, useMemo, useState } from "react"
import Select from "react-select"
import './Form.css'

export const chainOptions = [
  { 
    value: 'Kusama', 
    label: 'Kusama', 
    allowedChains: ['Basilisk'],
    allowedTokens: {
      from: ['KSM', 'BSX'],
      to: ['KSM', 'BSX']
    }
  },
  { 
    value: 'Karura', 
    label: 'Karura', 
    allowedChains: ['Basilisk'],
    allowedTokens: {
      from: ['aUSD', 'BSX', 'KSM'],
      to: ['aUSD', 'BSX', 'KSM']
    }
  },
  { 
    value: 'Basilisk', 
    label: 'Basilisk', 
    allowedChains: ['Kusama', 'Karura'],
    allowedTokens: {
      from: ['aUSD', 'KSM', 'BSX'],
      to: ['aUSD', 'KSM', 'BSX']
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

      const resetToChain = fromChain && !fromChain.allowedChains.includes(form.toChain.value);
      const resetAsset = (
        fromChain.allowedTokens.from.includes(form.asset && form.asset.value)
        || toChain && toChain.allowedTokens.to.includes(form.asset && form.asset.value)
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

      const resetFromChain = form.fromChain && !toChain.allowedChains.includes(form.fromChain.value);
      const resetAsset = (
        toChain.allowedTokens.to.includes(form.asset && form.asset.value)
        || fromChain && fromChain.allowedTokens.to.includes(form.asset && form.asset.value)
      );

      console.log('handleToChainChange', {
        toChain,
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

      const resetFromChain = fromChain  && !fromChain.allowedTokens.from.includes(asset.value);
      const resetToChain = toChain && !toChain.allowedTokens.to.includes(asset.value);

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
              ></Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}