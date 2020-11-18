// @ts-ignore
import Viewport from './Viewport.ts';
// @ts-ignore
import renderingEngineCache from './renderingEngineCache.ts';
// @ts-ignore
import RenderingEngine from './RenderingEngine.ts';
import createVolumeActor from './helpers/createVolumeActor';

interface VolumeActorEntry {
  uid: string;
  volumeActor: object;
}

interface SceneViewportsAPI {
  viewports: Array<Viewport>;
  setToolGroup: Function;
  setSyncGroups: Function;
}

/**
 * @class Scene - Describes a scene which defined a worldspace containing actors.
 * A scene may have different viewports which may be different views of this same data.
 */
class Scene {
  uid: string;
  renderingEngineUID: string;
  render: Function;
  private _viewports: Array<Viewport>;
  private _volumeActors: Array<VolumeActorEntry>;

  constructor(uid, renderingEngineUID, render) {
    this.uid = uid;
    this.renderingEngineUID = renderingEngineUID;
    this._viewports = [];
    this._volumeActors = [];
    this.render = render;
  }

  getRenderingEngine(): RenderingEngine {
    return renderingEngineCache.get(this.renderingEngineUID);
  }

  getViewports(): SceneViewportsAPI {
    return {
      viewports: this._viewports,
      setToolGroup: toolGroupUID => {
        // TODO Set the toolGroup of all viewports in the scene.
        this._viewports.forEach(viewport => {
          viewport.setToolGroup(toolGroupUID);
        });
      },
      setSyncGroups: (syncGroupUIDs = []) => {
        this._viewports.forEach(viewport => {
          viewport.setSyncGroups(syncGroupUIDs);
        });
      },
    };
  }

  getViewport(uid): Viewport {
    return this._viewports.find(vp => vp.uid === uid);
  }

  setVolumes(volumeData, immediate = false) {
    this._volumeActors = [];

    for (let i = 0; i < volumeData.length; i++) {
      const { volumeUID, callback } = volumeData[i];
      const volumeActor = createVolumeActor(volumeUID, callback);

      this._volumeActors.push({ volumeActor, uid: volumeUID });
    }

    this._viewports.forEach(viewport => {
      viewport._setVolumeActors(this._volumeActors);
    });

    if (immediate) {
      this.render();
    }
  }

  _addViewport(viewportProps) {
    const extendedViewportProps = Object.assign({}, viewportProps, {
      sceneUID: this.uid,
      renderingEngineUID: this.renderingEngineUID,
    });

    const viewport = new Viewport(extendedViewportProps);

    this._viewports.push(viewport);
  }

  getVolumeActor(uid): object {
    const volumeActors = this._volumeActors;

    const volumeActorEntry = volumeActors.find(va => va.uid === uid);

    if (volumeActorEntry) {
      return volumeActorEntry.volumeActor;
    }
  }

  getVolumeActors(): Array<VolumeActorEntry> {
    return [...this._volumeActors];
  }
}

export default Scene;