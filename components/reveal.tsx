"use client";
import { motion } from "framer-motion";
export default function Reveal({ children }: { children: React.ReactNode }) { return <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7, ease: "easeOut" }}>{children}</motion.div>; }
