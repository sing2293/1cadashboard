import type { HubAccess } from "@/lib/hub-access";

declare global {
  // Hub Clerk instance → Sessions → custom claim
  // { "metadata": "{{user.public_metadata}}" }
  interface CustomJwtSessionClaims {
    metadata?: HubAccess;
  }
}

export {};
