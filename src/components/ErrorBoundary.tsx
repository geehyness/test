// src/components/ErrorBoundary.tsx
"use client";

import React from 'react';
import { Box, Text, Button, VStack, Alert, AlertIcon } from '@chakra-ui/react';

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => React.ReactNode);
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Error caught by boundary:', error, errorInfo);
		this.setState({ errorInfo });

		// You can log to an error reporting service here
		// logErrorToService(error, errorInfo);
	}

	resetErrorBoundary = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				if (typeof this.props.fallback === 'function') {
					return this.props.fallback({
						error: this.state.error!,
						resetErrorBoundary: this.resetErrorBoundary
					});
				}
				return this.props.fallback;
			}

			return (
				<Box p={4} bg="white" borderRadius="md" boxShadow="sm" m={4}>
					<Alert status="error" mb={4} borderRadius="md">
						<AlertIcon />
						Something went wrong
					</Alert>
					<VStack spacing={4} align="stretch">
						<Text fontSize="lg" fontWeight="bold">
							Application Error
						</Text>
						<Text fontSize="sm" color="gray.600">
							{this.state.error?.message || 'An unexpected error occurred'}
						</Text>
						{process.env.NODE_ENV === 'development' && this.state.errorInfo && (
							<Box
								p={2}
								bg="gray.100"
								borderRadius="md"
								fontSize="xs"
								fontFamily="monospace"
								maxH="200px"
								overflow="auto"
							>
								<Text>Component Stack:</Text>
								<Text>{this.state.errorInfo.componentStack}</Text>
							</Box>
						)}
						<Button
							colorScheme="blue"
							onClick={this.resetErrorBoundary}
							size="sm"
						>
							Try Again
						</Button>
					</VStack>
				</Box>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;