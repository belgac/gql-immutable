// import objectResolve from './object/index';

import { Map, OrderedSet } from "immutable";
import { is } from 'ramda';
import gql from 'graphql-tag';
import graphql from '../gqlimm';

const query = gql`
  {
    accountsPositions {
      S_ACC {
        id
        name
        relations {
          GES_ESTIM_D {
            id,
            name,
            relations {
              S_ACC {
                id
                name
              }
            }
          }
        }        
      } 
    }
  }
`;

const store = Map({
  results: Map({
    accountsPositions: Map({
      S_ACC: OrderedSet([0, 1]),
      GES_ESTIM_D: OrderedSet([0, 1, 2])
    })
  }),
  relations: Map({
    S_ACC: Map({
      0: Map({
        GES_ESTIM_D: OrderedSet([1])
      }),
      1: Map({
        GES_ESTIM_D: OrderedSet([2])
      }),
      2: Map({
        GES_ESTIM_D: OrderedSet([1])
      })
    }),
    GES_ESTIM_D: Map({
      0: Map({
        S_ACC: OrderedSet([])
      }),
      1: Map({
        S_ACC: OrderedSet([0, 2])
      }),
      2: Map({
        S_ACC: OrderedSet([1])
      })
    })
  }),
  entities: Map({
    GES_ESTIM_D: Map({
      0: Map({ id: 0, name: "GES_ESTIM_D_0" }),
      1: Map({ id: 1, name: "GES_ESTIM_D_0" }),
      2: Map({ id: 2, name: "GES_ESTIM_D_0" })
    }),
    S_ACC: Map({
      0: Map({ id: 0, name: "S_ACC_0" }),
      1: Map({ id: 1, name: "S_ACC_1" }),
      2: Map({ id: 2, name: "S_ACC_2" })
    })
  })
});

const getResults = ({ fieldName }) => store
  .getIn(['results', fieldName], Map())
  .set('__typename', 'results')
  .set('__inResults', fieldName);

const getRelationsResultsIntersectin = ({ fieldName, rootValue }) => store
  .getIn(['results', rootValue.get('__inResults'), fieldName], OrderedSet())
  .intersect(rootValue.get(fieldName))
  .map(id => Map({
    id,
    __typename: fieldName,
    __inResults: rootValue.get('__inResults')
  }));

const getEntityProp = ({ rootValue, fieldName }) => fieldName === 'id'
  ? rootValue.get(fieldName)
  : store.getIn([
    'entities',
    rootValue.get('__typename'),
    `${rootValue.get('id')}`,
    fieldName
  ])

const getNonRelationProp = ({ rootValue, fieldName }) => is(OrderedSet, rootValue.get(fieldName))
  ? rootValue.get(fieldName, OrderedSet()).map(id => Map({
    id,
    __typename: fieldName,
    __inResults: rootValue.get('__inResults'),
  }))
  : getEntityProp({ rootValue, fieldName });

const getRelationProp = ({ rootValue, fieldName }) => store
    .getIn([
      'relations',
      rootValue.get('__typename'),
      `${rootValue.get('id')}`
    ], Map()).set('__typename', fieldName)
      .set('__inResults', rootValue.get('__inResults'))


const resolver = (fieldName, rootValue, args, context) => {
  if (!rootValue) {
    return getResults({ fieldName })
  } else if (rootValue.get('__typename') === 'relations') {
    return getRelationsResultsIntersectin({ fieldName, rootValue, args, context })
  } else if (fieldName !== 'relations') {
    return getNonRelationProp({ fieldName, rootValue, args, context })
  } else if (fieldName === 'relations') {
    return getRelationProp({ fieldName, rootValue, args, context })
  } else {
    throw 'fuuuu'
  }
};

const result = graphql(
  resolver,
  query,
  null,
  store,
);

console.log(result.toJS())


