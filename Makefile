-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil zktest

install :; forge install cyfrin/foundry-devops@0.2.3 --no-commit && forge install smartcontractkit/chainlink-brownie-contracts@1.3.0 --no-commit && forge install foundry-rs/forge-std@v1.8.2 --no-commit

# Update Dependencies
update:; forge update

build:; forge build

test:; forge test

deploy-mainnet:
	forge script script/DeployVirtualTrader.s.sol:DeployVirtualTrader --rpc-url $(LOCAL_RPC_URL) --account $(LOCAL_ACCOUNT) --sender $(LOCAL_SENDER) --broadcast -vvvv

deploy-anvil:
	forge script script/DeployVirtualTrader.s.sol:DeployVirtualTrader --rpc-url $(LOCAL_RPC_URL) --account $(LOCAL_ACCOUNT) --sender $(LOCAL_SENDER) --broadcast -vvvv
