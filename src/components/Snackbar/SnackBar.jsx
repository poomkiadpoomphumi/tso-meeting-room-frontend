import React, { useEffect } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';

const MyApp = ({ variant, text }) => {
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        enqueueSnackbar(text, { variant });
    }, [enqueueSnackbar, variant]); // Add dependencies to avoid unnecessary re-renders

    return null; // No need to render anything else in this component
}

const IntegrationNotistack = ({ text }) => {
    return (
        <SnackbarProvider maxSnack={3}>
            <MyApp variant="success" text={text} />
        </SnackbarProvider>
    );
}
export default IntegrationNotistack;
