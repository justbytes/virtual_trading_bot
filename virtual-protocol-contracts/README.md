
# Virtual Protocol Contracts



| Contract | Purpose | Access Control | Upgradable |
| ------ | ------ | ------ | ------ |
| veVirtualToken | This is a non-transferrable voting token to be used to vote on Virtual Protocol DAO and Virtual Genesis DAO  | Ownable | N |
| VirtualProtocolDAO | Regular DAO to maintain the VIRTUAL ecosystem | - | N | 
| VirtualGenesisDAO | Used to vote for instantiation of a VIRTUAL. This DAO allows early execution of proposal as soon as quorum (10k votes) is reached. | - | N |
| AgentFactory | Handles the application & instantiation of a new VIRTUAL. References to TBA registry, VIRTUAL DAO/Token implementation and Persona NFT vault contracts are stored here. | Roles : DEFAULT_ADMIN_ROLE, WITHDRAW_ROLE | Y | 
| AgentNft | This is the main registry for Persona, Core and Validator. Used to generate ICV wallet address.  | Roles: DEFAULT_ADMIN_ROLE, VALIDATOR_ADMIN_ROLE, MINTER_ROLE | Y |
| ContributionNft | Each contribution will mint a new ContributionNft. Anyone can propose a new contribution at the VIRTUAL DAO and mint token using the proposal Id.  | - | Y |
| ServiceNft | Accepted contribution will mint a ServiceNft, restricted to only VIRTUAL DAO can mint a ServiceNft. User can query the latest service NFT for a VIRTUAL CORE. | - | Y |
| AgentToken | This is implementation contract for VIRTUAL staking. AgentFactory will clone this during VIRTUAL instantiation. Staked token is non-transferable. | - | N |
| AgentDAO | This is implementation contract for VIRTUAL specific DAO. AgentFactory will clone this during VIRTUAL instantiation. It holds the maturity score for each core service. | - | N |
| AgentReward | This is reward distribution center. | Roles: GOV_ROLE, TOKEN_SAVER_ROLE | Y |
| TimeLockStaking | Allows user to stake their VIRTUAL in exchange for sVIRTUAL | Roles: GOV_ROLE, TOKEN_SAVER_ROLE | N |
| Virtual | VIRTUAL token | Ownable | N |
| Airdrop | Airdrop token to holders | - | N |


# Main Activities
## VIRTUAL Genesis
1. Submit a new application at **AgentFactory** 
	a. It will transfer VIRTUAL to AgentFactory
2. Propose at **VirtualGenesisDAO** (action = ```VirtualFactory.executeApplication``` )
3. Start voting at **VirtualGenesisDAO**
4. Execute proposal at  **VirtualGenesisDAO**  , it will do following:
	a. Clone **AgentToken**
	b. Clone **AgentDAO**
	c. Mint **AgentNft**
	d. Stake VIRTUAL -> $PERSONA (depending on the symbol sent to application)
	e. Create **TBA** with **AgentNft**
	

## Submit Contribution
1. Create proposal at **AgentDAO** (action = ServiceNft.mint)
2. Mint **ContributionNft** , it will authenticate by checking whether sender is the proposal's proposer.


## Upgrading Core
1. Validator vote for contribution proposal at **AgentDAO**
2. Execute proposal at **AgentDAO**, it will mint a **ServiceNft**, and trigger following actions:
	a. Update maturity score
	b. Update VIRTUAL core service id.


## Distribute Reward
1. On daily basis, protocol backend will conclude daily profits into a single amount.
2. Protocol backend calls **AgentReward**.distributeRewards , triggering following:
	a. Transfer VIRTUAL into **AgentReward** 
	b. Account & update claimable amounts for: Protocol, Stakers, Validators, Dataset Contributors, Model Contributors
	
	
## Claim Reward
1. Protocol calls **AgentReward**.withdrawProtocolRewards
2. Stakers, Validators, Dataset Contributors, Model Contributors calls **AgentReward**.claimAllRewards


## Staking VIRTUAL
1. Call **AgentToken**.stake , pass in the validator that you would like to delegate your voting power to. It will take in sVIRTUAL and mint $*PERSONA* to you.
2. Call **AgentToken**.withdraw to withdraw , will burn your $*PERSONA* and return sVIRTUAL to you.