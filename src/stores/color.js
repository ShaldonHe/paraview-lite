/* eslint-disable no-unused-vars */
import { Mutations, Actions } from 'paraview-lite/src/stores/types';

export default {
  state: {
    arrays: {},
    lookupTableWindows: {},
    presets: {},
    presetNames: [],
  },
  getters: {
    COLOR_PRESETS(state) {
      return state.presets;
    },
    COLOR_ARRAYS(state) {
      return state.arrays;
    },
    COLOR_LOOKUP_TABLE_WINDOWS(state) {
      return state.lookupTableWindows;
    },
  },
  mutations: {
    COLOR_PRESET_NAMES_SET(state, names) {
      state.presetNames = names;
    },
    COLOR_PRESETS_SET(state, { image, name }) {
      state.presets = Object.assign({}, state.presets, {
        [name]: { image, name },
      });
    },
    COLOR_ARRAYS_SET(state, { image, range, name }) {
      state.arrays = Object.assign({}, state.arrays, {
        [name]: { image, range, name },
      });
    },
    COLOR_LOOKUP_TABLE_WINDOWS_SET(
      state,
      { name, visible, position, orientation }
    ) {
      const windowConfig = Object.assign({}, state.lookupTableWindows[name], {
        name,
        visible,
        position,
        orientation,
      });
      state.lookupTableWindows = Object.assign({}, state.lookupTableWindows, {
        [name]: windowConfig,
      });
    },
  },
  actions: {
    COLOR_FETCH_PRESET_NAMES(
      { rootState, state, dispatch, commit },
      intervalTime = 500
    ) {
      const presetToFetch = state.presetNames.filter(
        (name) => !state.presets[name]
      );
      if (presetToFetch.length) {
        const client = rootState.network.client;
        if (client) {
          const name = presetToFetch.pop();
          client.remote.Lite.getLookupTablePreset(name, 255)
            .then(({ image }) => {
              commit(Mutations.COLOR_PRESETS_SET, { name, image });
              setTimeout(() => {
                dispatch(Actions.COLOR_FETCH_PRESET_NAMES, intervalTime);
              }, intervalTime);
            })
            .catch(console.error);
        }
      }
    },
    COLOR_FETCH_PRESET_IMAGE({ rootState, commit }, { name }) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Lite.getLookupTablePreset(name, 255).then(({ image }) => {
          commit(Mutations.COLOR_PRESETS_SET, { name, image });
        });
      }
    },
    COLOR_FETCH_LOOKUP_IMAGE({ rootState, commit }, name) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Lite.getLookupTableForArrayName(name, 255).then(
          ({ image, range }) => {
            commit(Mutations.COLOR_ARRAYS_SET, { name, image, range });
          }
        );
      }
    },
    COLOR_APPLY_PRESET({ rootState, dispatch }, { arrayName, presetName }) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Lite.applyPreset(arrayName, presetName).then(() => {
          dispatch(Actions.COLOR_FETCH_LOOKUP_IMAGE, arrayName);
        });
      }
    },
    COLOR_CUSTOM_DATA_RANGE({ rootState, commit, dispatch }, { name, range }) {
      const client = rootState.network.client;
      if (client) {
        client.remote.Lite.updateLookupTableRange(name, range);
      }
    },
    COLOR_BY(
      { rootState, commit, dispatch },
      {
        colorMode,
        representationId,
        arrayLocation,
        arrayName,
        vectorMode,
        vectorComponent,
        rescale,
      }
    ) {
      // console.log(
      //   'COLOR_BY',
      //   JSON.stringify(
      //     {
      //       colorMode,
      //       representationId,
      //       arrayLocation,
      //       arrayName,
      //       vectorMode,
      //       vectorComponent,
      //       rescale,
      //     },
      //     null,
      //     2
      //   )
      // );
      const client = rootState.network.client;
      if (client) {
        client.remote.ColorManager.colorBy(
          representationId,
          colorMode || 'SOLID',
          arrayLocation || 'POINTS',
          arrayName || '',
          vectorMode || 'Magnitude',
          vectorComponent || 0,
          rescale || false
        )
          .then(() => {
            dispatch(Actions.PROXY_DATA_FETCH, {
              proxyId: representationId,
              needUI: false,
            });
          })
          .catch(console.error);
      }
    },
  },
};
