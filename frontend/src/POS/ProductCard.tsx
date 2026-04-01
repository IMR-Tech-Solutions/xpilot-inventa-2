import { ProductData } from "../types/types";

const ProductCard = ({ product }: { product: ProductData }) => {
  const outOfStock = product.current_stock <= 0;
  const displayPrice = product.selling_price
    ? `₹${parseFloat(product.selling_price).toFixed(2)}`
    : "Price not set";

  return (
    <div className="product-details flex flex-col gap-2 items-start justify-center relative">
      {outOfStock && (
        <div className="absolute inset-0 bg-white/[0.1] dark:bg-white/[0.08] backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
          <span className="text-red-600 font-bold text-sm">OUT OF STOCK</span>
        </div>
      )}
      <img
        src={`${product.product_image}`}
        className="w-full h-40 object-cover rounded-xl"
        alt={product.product_name}
      />
      <h2 className="text-sm theme-text-2">{product.product_name}</h2>
      <h3 className="text-xs theme-text">Category: {product.category_name}</h3>
      <div className="flex items-center justify-between w-full mb-3">
        <h2 className="text-sm theme-text">Stock: {product.current_stock}</h2>
        <h2 className="text-sm theme-text-2">{displayPrice}</h2>
      </div>
      <button className="text-sm bg-brand-500 text-white w-full py-1 rounded-md hover:bg-brand-700 duration-300">
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
