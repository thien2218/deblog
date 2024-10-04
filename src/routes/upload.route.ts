import { AppEnv } from "@/context";
import { Hono } from "hono";

const uploadRoutes = new Hono<AppEnv>().basePath("/upload");

export default uploadRoutes;
