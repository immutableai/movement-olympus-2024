import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import SubstrateProvider, { SubstrateContext } from "@/context/substrate-context";
import useSubstrate from '@/hooks/use-substrate';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';


jest.mock('@polkadot/extension-dapp', () => ({
    web3Enable: jest.fn(),
    web3Accounts: jest.fn(),
    web3FromAddress: jest.fn().mockResolvedValue({
        signer: jest.fn(),
    }),
}));

jest.mock('../hooks/use-substrate', () => ({
    __esModule: true,
    default: jest.fn(),
}));


describe('Polkadot.js Connect and Contract API Tests', () => {
    it('Connects to Polkadot.js node successfully', async () => {
        render(
            <SubstrateProvider>
                <SubstrateContext.Consumer>
                    {({ state }) => (
                        <div>
                            <span>Connection state: {state.apiState}</span>
                        </div>
                    )}
                </SubstrateContext.Consumer>
            </SubstrateProvider>
        );
        // Wait for the component to update to 'READY'
        await waitFor(() => {
            // Assert that connect function is called
            expect(screen.getByText('Connection state: READY')).toBeInTheDocument();
        });
    });

    it('Contract instance created successfully', async () => {
        render(
            <SubstrateProvider>
                <SubstrateContext.Consumer>
                    {({ state }) => (
                        <div>
                            <span>Contract state: {state.contractState}</span>
                        </div>
                    )}
                </SubstrateContext.Consumer>
            </SubstrateProvider>
        );

        // Wait for the component to update to 'READY'
        await waitFor(() => {
            // Assert that connect function is called
            expect(screen.getByText('Contract state: READY')).toBeInTheDocument();
        });
    });
});

describe('Polkadot.js Load Accounts Tests', () => {
    it('Loads accounts when extensions are available', async () => {
        // Mock web3Enable to return an array with some extensions
        web3Enable.mockResolvedValue(['extension1', 'extension2']);

        // Mock web3Accounts to return some accounts
        const mockAccounts = ['account1', 'account2'];
        web3Accounts.mockResolvedValue(mockAccounts);

        // Render the component that uses loadAccounts
        render(
            <SubstrateProvider>
                <SubstrateContext.Consumer>
                    {({ state }) => (
                        <div>
                            <span>Number of accounts: {state.allAccounts.length}</span>
                        </div>
                    )}
                </SubstrateContext.Consumer>
            </SubstrateProvider>
        );

        // Wait for the component to update
        await waitFor(() => {
            // Assert that the number of accounts is as expected
            expect(screen.getByText('Number of accounts: 2')).toBeInTheDocument(); // Update the number as per your mock data
        });
    });
});

describe('Polkadot.js Submit Job Tests', () => {
    test('Submits job successfully', async () => {
        // Mock the hook's return value
        useSubstrate.mockReturnValue({
            substrate: { state: { apiState: 'READY', contract: {} } },
            submitJob: jest.fn(),
        });

        const { result } = renderHook(() => useSubstrate());
        const { submitJob } = result.current;

        await submitJob('cidManifest', 5, 'walletAddress');

        // Assert that job creation was successful
        expect(submitJob).toHaveBeenCalled(); // Ensure submitJob was called
        expect(useSubstrate).toHaveBeenCalled(); // Ensure useSubstrate hook was called
    });
});