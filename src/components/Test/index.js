import React from "react";

const ComponentsTest1 = ({ params1 }) => {
    return (
        <>
            {console.log(params1)}
        </>
    );
};
const ComponentsTest2 = ({ params2 }) => {
    return (
        <>
            {console.log(params2)}
        </>
    );
};

const ComponentsTest = ({ params1, params2 }) => {
    return (
        <>
            <ComponentsTest1 params1={params1} />
            <ComponentsTest2 params2={params2} />
        </>
    );
};

export { ComponentsTest1, ComponentsTest2 }; // Named exports
export default ComponentsTest; // Default export