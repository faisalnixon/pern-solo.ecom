import { Router } from "express";
import {
  getCategories,
  getProductBySlug,
  listProducts,
} from "../controllers/productController";

const router = Router();

router.get("/", listProducts);
router.get("/categories", getCategories);
router.get("/:slug", getProductBySlug); 
// by ":" it turns the router into a dynamic route, so that we can get the product by its slug 

// router.get("/:slug", getProductBySlug); 
// router.get("/categories", getCategories); this order of the catagories  slug route will make conflict for the categories route, because the categories route will be treated as a slug route, so we need to put the categories route before the slug route


export default router;
