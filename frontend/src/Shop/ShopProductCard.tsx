import { ProductData } from "../types/types";

const ShopProductCard = ({ product }: { product: ProductData }) => {
  return (
    <>
      <div className="product-details flex flex-col gap-2 items-start justify-center">
        <img
          src={`${product.product_image}`}
          className="w-full h-40 object-cover rounded-xl"
        />
        <h2 className="text-sm theme-text-2">{product.product_name}</h2>
        <h3 className="text-xs theme-text">
          Category: {product.category_name}
        </h3>
        <button className="text-sm bg-brand-500 text-white w-full py-1 rounded-md hover:bg-brand-700 duration-300">
          Add to Cart
        </button>
      </div>
    </>
  );
};

export default ShopProductCard;
