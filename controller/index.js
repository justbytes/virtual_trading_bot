// TODO: Start a listener on the Bonding.sol contract that listens for the Launched event which is
//       emitted when a new token pair is created. This is a new token is the token that is created
//       before it is listed on Uniswap.

// TODO: Start a listener on the the Bonding.sol contract that listens for the Graduated event which is
//       emmited when a token reached the required virutal market cap threshhold.
//       - Then check if we have the fun token that was graduated in our wallet and call the unwrapToken function
//         on the Bonding.sol contract.
//       - Try to swap the token for a profit and activate a new listener that tries to algo trade the new pair
