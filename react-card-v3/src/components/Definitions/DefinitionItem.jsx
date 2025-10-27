import React from 'react';

const DefinitionItem = ({dt, dd}) => {
    return (
        <dl>
            <dt>{dt}</dt>
            <dd>{dd}</dd>
        </dl>
    )
}

export default DefinitionItem;