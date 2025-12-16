import React from 'react';
import { Trophy, Lock, CheckCircle, TrendingUp } from 'lucide-react';

interface RankProgressCardProps {
  currentPoints: number;
  currentRank: string;
  currentLevel: string;
  averageWpm: number;
  averageAccuracy: number;
}

interface RankTier {
  rank: string;
  level: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const rankTiers: RankTier[] = [
  { rank: 'D-Rank', level: 'Beginner', minPoints: 0, maxPoints: 499, color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' },
  { rank: 'C-Rank', level: 'Intermediate', minPoints: 500, maxPoints: 1499, color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  { rank: 'B-Rank', level: 'Advanced', minPoints: 1500, maxPoints: 2999, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  { rank: 'A-Rank', level: 'Expert', minPoints: 3000, maxPoints: 4999, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  { rank: 'S-Rank', level: 'Master', minPoints: 5000, maxPoints: 99999, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
];

export const RankProgressCard: React.FC<RankProgressCardProps> = ({
  currentPoints,
  currentRank,
  currentLevel,
  averageWpm,
  averageAccuracy,
}) => {
  const currentTierIndex = rankTiers.findIndex(tier => tier.rank === currentRank);
  const currentTier = rankTiers[currentTierIndex];
  const nextTier = rankTiers[currentTierIndex + 1];

  const progressToNextRank = nextTier
    ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const pointsNeeded = nextTier ? nextTier.minPoints - currentPoints : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${currentTier.bgColor} rounded-lg flex items-center justify-center`}>
            <Trophy className={`w-6 h-6 ${currentTier.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Your Rank Progress</h3>
            <p className="text-sm text-gray-600">{currentPoints} Total Points</p>
          </div>
        </div>
        <div className={`px-4 py-2 ${currentTier.bgColor} ${currentTier.borderColor} border-2 rounded-lg`}>
          <div className={`text-xl font-bold ${currentTier.color}`}>{currentRank}</div>
          <div className="text-xs text-gray-600 text-center">{currentLevel}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {nextTier ? `Progress to ${nextTier.rank}` : 'Maximum Rank Achieved!'}
          </span>
          {nextTier && (
            <span className="text-sm font-bold text-gray-900">
              {pointsNeeded} points needed
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              currentTier.rank === 'S-Rank' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
              currentTier.rank === 'A-Rank' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
              currentTier.rank === 'B-Rank' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              currentTier.rank === 'C-Rank' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
              'bg-gradient-to-r from-gray-400 to-gray-600'
            }`}
            style={{ width: `${Math.min(progressToNextRank, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{currentTier.minPoints} pts</span>
          {nextTier && <span>{nextTier.minPoints} pts</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-700">{Math.round(averageWpm)}</div>
          <div className="text-xs text-gray-600">Avg WPM</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-700">{Math.round(averageAccuracy)}%</div>
          <div className="text-xs text-gray-600">Avg Accuracy</div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Rank Progression Path
        </h4>
        <div className="space-y-2">
          {rankTiers.map((tier, index) => {
            const isUnlocked = currentPoints >= tier.minPoints;
            const isCurrent = tier.rank === currentRank;

            return (
              <div
                key={tier.rank}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  isCurrent
                    ? `${tier.bgColor} ${tier.borderColor}`
                    : isUnlocked
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isUnlocked ? tier.bgColor : 'bg-gray-200'
                  }`}>
                    {isUnlocked ? (
                      isCurrent ? (
                        <Trophy className={`w-4 h-4 ${tier.color}`} />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isUnlocked ? tier.color : 'text-gray-400'}`}>
                      {tier.rank}
                    </div>
                    <div className="text-xs text-gray-600">{tier.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                    {tier.minPoints}+ pts
                  </div>
                  {tier.level === 'Intermediate' && (
                    <div className="text-xs text-orange-600 font-medium">Unlocks Intermediate Classes</div>
                  )}
                  {tier.level === 'Advanced' && tier.rank === 'B-Rank' && (
                    <div className="text-xs text-blue-600 font-medium">Unlocks Advanced Classes</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-1">Keep Practicing!</h5>
            <p className="text-xs text-gray-700 leading-relaxed">
              Complete lessons with high accuracy and speed to earn points. Each rank requires significant practice to achieve.
              {nextTier && ` Reach ${nextTier.minPoints} points to unlock ${nextTier.level} level and access new classes!`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
