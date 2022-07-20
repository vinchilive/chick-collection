import { BigNumber } from 'ethers'
import React from 'react'
import NetworkConfigInterface from '../../../../smart-contract/lib/NetworkConfigInterface'

interface Props {
  networkConfig: NetworkConfigInterface
  maxSupply: number
  totalSupply: number
  tokenPrice: BigNumber
  maxMintAmountPerTx: number
  isPaused: boolean
  loading: boolean
  isWhitelistMintEnabled: boolean
  isUserInWhitelist: boolean
  errorMessage: string | JSX.Element | null
  mintTokens(mintAmount: number): Promise<void>
  whitelistMintTokens(mintAmount: number): Promise<void>
}

interface State {
  mintAmount: number
}

const defaultState: State = {
  mintAmount: 1,
}

export default class MintWidget extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = defaultState
  }

  private canMint(): boolean {
    return !this.props.isPaused || this.canWhitelistMint()
  }

  private canWhitelistMint(): boolean {
    return this.props.isWhitelistMintEnabled && this.props.isUserInWhitelist
  }

  private incrementMintAmount(): void {
    this.setState({
      mintAmount: Math.min(
        this.props.maxMintAmountPerTx,
        this.state.mintAmount + 1
      ),
    })
  }

  private decrementMintAmount(): void {
    this.setState({
      mintAmount: Math.max(1, this.state.mintAmount - 1),
    })
  }

  private async mint(): Promise<void> {
    if (!this.props.isPaused) {
      await this.props.mintTokens(this.state.mintAmount)

      return
    }

    await this.props.whitelistMintTokens(this.state.mintAmount)
  }

  render() {
    return (
      <>
        {this.canMint() ? (
          <div
            className={`mint-widget space-y-4 pb-8 px-8 ${
              this.props.loading
                ? 'animate-pulse saturate-0 pointer-events-none'
                : ''
            }`}
          >
            <div className="flex items-center justify-evenly gap-4">
              <div className="rounded-xl flex-1 bg-sky-400 px-4 py-2 text-white text-center text-sm">
                <div className="font-thin">Eggs</div>
                <div>1/9999</div>
              </div>
              <div className="rounded-xl flex-1 bg-sky-400 px-4 py-2 text-white text-center text-sm">
                <div className="font-thin">Sale Status</div>
                <div>Whitelist only</div>
              </div>
            </div>

            {this.props.errorMessage ? (
              <div className="error">
                <p>{this.props.errorMessage}</p>
              </div>
            ) : null}

            <div className="controls gap-8 flex justify-evenly">
              <div className="flex-1 flex items-center">
                <button
                  className="decrease text-white text-6xl"
                  disabled={this.props.loading}
                  onClick={() => this.decrementMintAmount()}
                >
                  -
                </button>
                <span className="mint-amount text-white text-6xl">
                  {this.state.mintAmount}
                </span>
                <button
                  className="increase text-white text-6xl"
                  disabled={this.props.loading}
                  onClick={() => this.incrementMintAmount()}
                >
                  +
                </button>
              </div>
              <div className="flex-1">
                <button
                  className="primary w-full shadow rounded-xl py-2 h-full"
                  disabled={this.props.loading}
                  onClick={() => this.mint()}
                >
                  mint
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="cannot-mint">
            <span className="emoji">⏳</span>
            {this.props.isWhitelistMintEnabled ? (
              <>
                You are not included in the <strong>whitelist</strong>.
              </>
            ) : (
              <>
                The contract is <strong>paused</strong>.
              </>
            )}
            <br />
            Please come back during the next sale!
          </div>
        )}
      </>
    )
  }
}
