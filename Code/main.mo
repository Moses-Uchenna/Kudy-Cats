import IC_Bridge "mo:ic-bridge/IC_Bridge";
IC_Bridge.addChain(
  "Polygon"; // The name of the chain
  "0x0000000000000000000000000000000000000000"; // The address of the bridge contract on Polygon
  "0x0000000000000000000000000000000000000000"; // The address of the wrapped token contract on Polygon
  100; // The conversion rate between MATIC and wMATIC
  1; // The minimum amount of tokens that can be transferred
  1000 // The maximum amount of tokens that can be transferred
);

public func transferChain (id : Nat, newChain : Text) : async Bool {
    // Find the token by its id
    switch (getToken (id)) {
      // If the token exists, check the ownership and the chain
      case (?token) {
        // Get the caller's identity
        let caller = Principal.fromActor (this);
        // Check if the caller is the current owner of the token
        if (caller == token.owner) {
          // Check if the token is already on the desired chain
          if (token.chain == newChain) {
            // Return true to indicate success
            return true;
          } else {
            // Use the IC Bridge protocol to transfer the token to the new chain
            switch (newChain) {
              // If the new chain is Polygon, wrap the token and send it to the bridge contract
              case ("Polygon") {
                let wrappedToken = IC_Bridge.wrapToken (token.id, token.name, token.owner);
                let result = IC_Bridge.sendToken (wrappedToken, "Polygon");
                if (result) {
                  // Update the token's chain to Polygon
                  token.chain := "Polygon";
                  // Return true to indicate success
                  return true;
                } else {
                  // Return false to indicate failure
                  return false;
                };
              };
              // If the new chain is Internet Computer, unwrap the token and receive it from the bridge contract
              case ("Internet Computer") {
                let result = IC_Bridge.receiveToken (token.id, token.name, token.owner, "Polygon");
                if (result) {
                  // Update the token's chain to Internet Computer
                  token.chain := "Internet Computer";
                  // Return true to indicate success
                  return true;
                } else {
                  // Return false to indicate failure
                  return false;
                };
              };
              // If the new chain is not supported, return false
              case (_) {
                return false;
              };
            };
          };
        } else {
          // Return false to indicate failure
          return false;
        };
      };
      // If the token does not exist, return false
      case (null) {
        return false;
      };
    };
  };
