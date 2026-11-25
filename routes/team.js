// backend/routes/team.js
import express from "express";
import TeamMember from "../models/TeamMember.js";
import { ownerOf, pick, sendError, createRecord } from "../utils/ownership.js";
import { requireDraftAuth, matchingOwner } from "../middleware/tenantScope.js";

const MEMBER_FIELDS = ["fullName", "email", "phone", "role"];

// Team members belong to the signed-in user (req.user from the verified JWT).
export function createTeamRouter({ members = TeamMember, auth = requireDraftAuth } = {}) {
  const router = express.Router();
  router.use(auth, matchingOwner);   // a userId in query/body must match the session (403)

  router.post("/", async (req, res) => {
    try {
      const member = await createRecord(members, { ...pick(req.body, MEMBER_FIELDS, { max: 300 }), userId: ownerOf(req) });
      res.status(201).json({ message: "Team member added successfully", member });
    } catch (error) {
      if (error?.code === 11000) return res.status(400).json({ error: "A team member with this email already exists." });
      sendError(res, error);
    }
  });

  router.get("/", async (req, res) => {
    try {
      res.json(await members.find({ userId: ownerOf(req) }));
    } catch (error) { sendError(res, error); }
  });

  return router;
}

export default createTeamRouter();
