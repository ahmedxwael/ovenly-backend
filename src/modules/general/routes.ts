import { router } from "@/core";
import { healthController } from "./controllers";

router.route("/health").get(healthController);
