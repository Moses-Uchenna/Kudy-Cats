// Import the IC Bridge library to work with other blockchains
import IC_Bridge "mo:ic-bridge/IC_Bridge";

// Define a type for the kudy cat token
type KudyCatToken = {
  id : Nat; // A unique identifier
  owner : Principal; // The current owner of the token
  chain : Text; // The name of the chain where the token is currently stored
  metadata : Text; // The IPFS hash of the metadata JSON file
};

// Define a type for the kudy cat collection
type KudyCatCollection = {
  name : Text; // A name for the collection
  tokens : [KudyCatToken]; // An array of tokens in the collection
};

// Define an actor that represents the kudy cat collection
actor KudyCatCollection {

  // Initialize the collection with a name and an empty array of tokens
  var collection : KudyCatCollection = {
    name = "Kudy Cats";
    tokens = [];
  };

  // A public function that returns the collection name
  public func getName () : async Text {
    return collection.name;
  };

  // A public function that returns the number of tokens in the collection
  public func getSize () : async Nat {
    return collection.tokens.size ();
  };

  // A public function that returns a token by its id, or null if not found
  public func getToken (id : Nat) : async ?KudyCatToken {
    return collection.tokens.find (func (token : KudyCatToken) : Bool { token.id == id });
  };

  // A public function that creates a new token and adds it to the collection
  // The caller of this function becomes the owner of the new token
  // The token is initially stored on the Internet Computer chain
  // The metadata parameter is the IPFS hash of the metadata JSON file
  public func mintToken (metadata : Text) : async KudyCatToken {
    // Generate a new id by incrementing the size of the collection
    let id = collection.tokens.size () + 1;
    // Get the caller's identity
    let owner = Principal.fromActor (this);
    // Create a new token with the given id, owner, chain, and metadata
    let token = {id; owner; chain = "Internet Computer"; metadata};
    // Add the token to the collection
    collection.tokens := collection.tokens.append ([token]);
    // Return the token
    return token;
  };

  // A public function that transfers a token from the current owner to a new owner
  // The caller of this function must be the current owner of the token
  public func transferToken (id : Nat, newOwner : Principal) : async Bool {
    // Find the token by its id
    switch (getToken (id)) {
      // If the token exists, check the ownership and update it
      case (?token) {
        // Get the caller's identity
        let caller = Principal.fromActor (this);
        // Check if the caller is the current owner of the token
        if (caller == token.owner) {
          // Update the token's owner to the new owner
          token.owner := newOwner;
          // Return true to indicate success
          return true;
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

  // A public function that transfers a token from one chain to another
  // The caller of this function must be the current owner of the token
  // The token must be wrapped or unwrapped using the IC Bridge protocol
  public func transferChain (id : Nat, newChain : Text) : async Bool {
    // Find the token by its id
    switch (getToken (id)) {
      // If the token exists, check the ownership and chain
      case (?token) {
        // Get the caller's identity
        let caller = Principal.fromActor (this);
        // Check if the caller is the current owner of the token
        if (caller == token.owner) {
          // Check if the new chain is different from the current chain
          if (newChain != token.chain) {
            // Check if the new chain is supported by the IC Bridge
            if (IC_Bridge.isSupportedChain (newChain)) {
              // Wrap or unwrap the token using the IC Bridge protocol
              let result = IC_Bridge.transferToken (token.id, token.metadata, token.chain, newChain);
              // Check if the transfer was successful
              if (result) {
                // Update the token's chain to the new chain
                token.chain := newChain;
                // Return true to indicate success
                return true;
              } else {
                // Return false to indicate failure
                return false;
              };
            } else {
              // Return false to indicate unsupported chain
              return false;
            };
          } else {
            // Return false to indicate same chain
            return false;
          };
        } else {
          // Return false to indicate unauthorized transfer
          return false;
        };
      };
      // If the token does not exist, return false
      case (null) {
        return false;
      };
    };
  };
};
