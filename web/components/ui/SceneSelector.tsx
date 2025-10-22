'use client';

import { SCENE_OPTIONS } from '@/lib/constants';

interface SceneSelectorProps {
  selectedScenes: string[];
  onSceneToggle: (sceneId: string) => void;
}

export default function SceneSelector({
  selectedScenes,
  onSceneToggle,
}: SceneSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        3. Choose Scenes ({selectedScenes.length} selected)
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SCENE_OPTIONS.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSceneToggle(scene.id)}
            className={`p-4 rounded-lg border-2 transition ${
              selectedScenes.includes(scene.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl mb-2">{scene.icon}</div>
            <p className="text-sm font-medium">{scene.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
