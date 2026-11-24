import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { ORBIT_TOOLS } from '../../lib/constants';
import { Wallet, BellRing, FileText, Shield, ArrowRight, Sparkles, Orbit, Compass, Zap, Car } from 'lucide-react';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import { motion } from 'framer-motion';

const ICONS = {
  Wallet,
  Car,
  BellRing,
  FileText,
  ShieldLock: Shield,
  Shield,
};

export const HubPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-10 space-y-12">
      {/* Parallax Hero Home Base Section */}
      <ParallaxSection offset={25} speed={0.1}>
        <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden bg-gradient-to-b from-white/80 via-white/40 to-transparent dark:from-[#121217]/90 dark:via-[#121217]/50 dark:to-transparent border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl shadow-2xl">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-[90px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold tracking-wide uppercase">
              <Orbit className="w-3.5 h-3.5 animate-spin [animation-duration:12s]" />
              <span>Orbit Command Center</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight font-display">
              Good day, <span className="text-emerald-600 dark:text-emerald-400">{user?.name ? user.name.split(' ')[0] : 'Commander'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl font-medium">
              Welcome to your personal control deck. Seamlessly navigate your financial engine, automated schedules, and upcoming productivity instruments.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-bold text-zinc-500">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                2 Modules Active
              </span>
              <span>•</span>
              <span className="text-zinc-400">2 Upcoming Enhancements</span>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* Parallax Tools Grid Section with 3D Depth */}
      <ParallaxSection offset={35} speed={0.15}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>Modular Workspaces</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ORBIT_TOOLS.map((tool) => {
              const IconComponent = ICONS[tool.icon] || Wallet;
              const isActive = tool.status === 'active';

              const cardContent = (
                <ParallaxCard
                  depth={isActive ? 12 : 3}
                  interactive={isActive}
                  className={`h-full border transition-all duration-300 ${
                    isActive
                      ? 'bg-white/90 dark:bg-[#141418]/90 border-zinc-200/90 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 backdrop-blur-xl group cursor-pointer'
                      : 'bg-zinc-100/40 dark:bg-white/[0.02] border-zinc-200/40 dark:border-white/5 opacity-60 cursor-not-allowed select-none backdrop-blur-sm'
                  }`}
                >
                  <div className="p-7 flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${tool.gradient} text-white flex items-center justify-center shadow-lg transition-transform duration-300 ${
                            isActive ? 'group-hover:scale-110 group-hover:rotate-3 shadow-emerald-500/30' : 'grayscale-[40%]'
                          }`}
                        >
                          <IconComponent className="w-7 h-7" />
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                              : 'bg-zinc-200/60 text-zinc-600 dark:bg-white/10 dark:text-zinc-400'
                          }`}
                        >
                          {tool.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 font-display">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-medium">
                          {tool.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-white/6 flex items-center justify-between text-xs font-black">
                      {isActive ? (
                        <>
                          <span className="text-emerald-600 dark:text-emerald-400 group-hover:underline">
                            Enter Workspace
                          </span>
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 italic font-medium">
                          Under Construction
                        </span>
                      )}
                    </div>
                  </div>
                </ParallaxCard>
              );

              return isActive ? (
                <Link key={tool.id} to={tool.path} className="block h-full">
                  {cardContent}
                </Link>
              ) : (
                <div key={tool.id} className="h-full">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default HubPage;
