import {
  extension,
  TextField,
} from "@shopify/ui-extensions/checkout";
// Set the entry point for the extension
export default extension("purchase.checkout.block.render", renderApp);
 
function renderApp(root, { extension, buyerJourney, deliveryGroups, lines, query }) {
  // Set the target age that a buyer must be to complete an order
  const ageTarget = 18;
  const dropShipping = extension;
  console.log(dropShipping);
  // Set up the app state
  const state = {
    age: "",
    canBlockProgress: extension.capabilities.current.includes("block_progress"),
  };
  console.log(dropShipping);
  let tags = [];
  var drop_shipping = true;
  var no_delivery = false;
  // Merchants can toggle the `block_progress` capability behavior within the checkout editor
  extension.capabilities.subscribe((capabilities) => {
    state.canBlockProgress = capabilities.includes("block_progress");
  });
 
  // Use the `buyerJourney` intercept to conditionally block checkout progress
  buyerJourney.intercept(({ canBlockProgress }) => {
    // console.log("Delivery Method ",deliveryGroups.current[0].deliveryOptions[0].type);
    var deliveryMehtod = deliveryGroups.current[0].deliveryOptions[0].type;
    for(var i=0; i<lines.current.length; i++){
      // console.log(lines.current[i].merchandise.product.id);
      fetchProductsTag(query, lines.current[i].merchandise.product.id)
      .then((responseData) => {
        // Extract tags from the response data
        tags = responseData.data.product.tags;
        if(tags.includes('drop_shipping')){
          drop_shipping = false;
        }
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        // Handle errors here
      });
    }
    console.log(drop_shipping);
    if (canBlockProgress && deliveryMehtod === "pickup" && !drop_shipping) {
      console.log('here');
      return {
        behavior: "block",
        reason: `Not Allowed`,
        errors: [
          {
            message:
              "Sorry These items are not available for pickup",
          },
        ],
      };
    }
      return {
        behavior: "allow",
        perform: () => {
        },
      };
   
  });
 
  function fetchProductsTag(query, productId) {
    return query(
      `query ($id: ID!) {
        product(id: $id) {
          tags
        }
      }`,
      {
        variables: { id: productId },
      }
    )
  }
 
}