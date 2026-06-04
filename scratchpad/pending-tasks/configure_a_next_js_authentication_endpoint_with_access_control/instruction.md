A common friction point in Liveblocks is properly setting up the authentication endpoint to securely manage who can access specific rooms.

You need to create a Next.js API route (`pages/api/liveblocks-auth.ts` or App Router equivalent) that authenticates a user and restricts room access based on a simulated "Organization ID". 

**Constraints:**
- Must use the `identifyUser` method (ID tokens) rather than `prepareSession`.
- The endpoint must intercept the room request and verify that the user's `organizationId` matches the required ID for the requested room.
- Reject the request with a 403 status if the user does not belong to the organization.