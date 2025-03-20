// Add this to any file where you're processing products
function debugProductCategory(product) {
  console.log(`Product ID: ${product.id}, Name: ${product.name}, Category: ${product.category || "UNDEFINED"}`)

  // Check if the category is null, undefined, or empty string
  if (!product.category) {
    console.warn(`WARNING: Product ${product.name} (ID: ${product.id}) has no category!`)
  }

  return product
}

// Use this function when processing products:
// const products = await getProducts();
// products.forEach(debugProductCategory);

