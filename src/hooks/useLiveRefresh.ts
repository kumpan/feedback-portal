"use client";

import { useEffect, useRef } from "react";

/**
 * Polls a cheap version signal and fires `onChange` when it moves.
 *
 * Vercel + Neon is serverless with no pub/sub, so there is nothing to push
 * from — a WebSocket or SSE stream would still have to poll the database, just
 * on the server's dime while holding a function invocation open. Polling a
 * single aggregate query from the client is the cheaper equivalent here.
 *
 * Polling stops while the tab is hidden and runs once immediately on return,
 * so a backgrounded dashboard costs nothing and is current the moment you look
 * at it.
 */
export function useLiveRefresh<T>({
	getVersion,
	onChange,
	intervalMs = 15000,
	enabled = true,
}: {
	getVersion: () => Promise<T>;
	onChange: () => void;
	intervalMs?: number;
	enabled?: boolean;
}) {
	// Kept in refs so a new inline callback each render doesn't restart the timer.
	const getVersionRef = useRef(getVersion);
	const onChangeRef = useRef(onChange);
	const lastVersionRef = useRef<string | null>(null);
	const inFlightRef = useRef(false);

	useEffect(() => {
		getVersionRef.current = getVersion;
		onChangeRef.current = onChange;
	});

	useEffect(() => {
		if (!enabled) return;

		let cancelled = false;

		const check = async () => {
			// Skip if the tab is hidden or a previous check is still running, so a
			// slow response can't stack up requests.
			if (document.visibilityState !== "visible" || inFlightRef.current) return;

			inFlightRef.current = true;
			try {
				const version = JSON.stringify(await getVersionRef.current());
				if (cancelled) return;

				// Only the very first run establishes a baseline silently. Nothing
				// else may reset it to null: a null baseline swallows whatever changed
				// since it was cleared, because the next poll adopts the current
				// version without reporting it. After a local mutation we simply let
				// the next poll notice our own change and refetch once more — a
				// redundant fetch is cheaper than a lost update.
				if (lastVersionRef.current === null) {
					lastVersionRef.current = version;
				} else if (lastVersionRef.current !== version) {
					lastVersionRef.current = version;
					onChangeRef.current();
				}
			} catch {
				// A failed poll is not worth surfacing — the next tick retries.
			} finally {
				inFlightRef.current = false;
			}
		};

		const interval = setInterval(check, intervalMs);
		const onVisibility = () => {
			if (document.visibilityState === "visible") check();
		};
		document.addEventListener("visibilitychange", onVisibility);
		check();

		return () => {
			cancelled = true;
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [intervalMs, enabled]);
}
