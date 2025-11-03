import React from 'react';
import DefinitionsItem from './DefinitionItem';

const Definitions = ({data}) => {
    const definitionsList = data.map(({dt, dd, id}) => {
        return <DefinitionsItem dt={dt} dd={dd} key={id}/>
    });
    
    return (
        <>
        {definitionsList}
        </>
    );
}

export default Definitions;