import { motion } from "framer-motion";
import Link from "next/link";

import { LogoOpenAI, MessageIcon, VercelIcon } from "./icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
    <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
  <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
    
    <MessageIcon />
  </p>
  <p>
    Welcome to your SCA Prep AI Tutor. You can ask it any medical topic you like, and it will provide you with answers based on UK Guidelines to help with your SCA revision.
  </p>
  <p>
    Your previous conversations will all be saved so you can review them later.</p>
    <p>The information should not be used as medical advice. It has been designed to help GP trainees with SCA exam revision, and not for medical advice in the real world or for non-professionals.
  </p>
</div>
    </motion.div>
  );
};
