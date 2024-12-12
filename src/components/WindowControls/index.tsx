import {
	useCallback,
	useLayoutEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import styles from "./index.module.css";
import { WindowsSystemsControls } from "./windows.tsx";
import { MacOSSystemsControls } from "./macos.tsx";

export type WindowControlsVariant = "windows" | "macos";

export interface WindowControlsProps {
	variant?: WindowControlsVariant;
	titleChildren?: React.ReactNode;
	startChildren?: React.ReactNode;
	endChildren?: React.ReactNode;
	onClosed?: () => void;
	onMaximized?: () => void;
	onMinimized?: () => void;
}

export interface SystemControlProps {
	isMaximized: boolean;
	onClosed: () => void;
	onMaximized: () => void;
	onMinimized: () => void;
}

export default function WindowControls(props: WindowControlsProps) {
	const [variant, setVariant] = useState<WindowControlsVariant>("windows");
	const placeLeft = useMemo(() => variant === "macos", [variant]);

	useLayoutEffect(() => {
		if (props.variant) return setVariant(props.variant);
		if (import.meta.env.DEV)
			console.log(
				"Setting variant based on platform:",
				import.meta.env.TAURI_ENV_PLATFORM,
			);
		switch (import.meta.env.TAURI_ENV_PLATFORM) {
			case "windows":
				return setVariant("windows");
			case "darwin":
				return setVariant("macos");
			case "linux":
				return setVariant("windows");
		}
	}, [props.variant]);

	const onClosed = useCallback(async () => {
		if (props.onClosed) return props.onClosed();
		try {
			const tauriWin = import("@tauri-apps/api/window");
			await (await tauriWin).getCurrentWindow().close();
		} catch (err) {
			if (import.meta.env.DEV) console.warn(err);
		}
	}, [props.onClosed]);

	const onMaximized = useCallback(async () => {
		if (props.onMaximized) return props.onMaximized();
		try {
			const tauriWin = import("@tauri-apps/api/window");
			const win = (await tauriWin).getCurrentWindow();
			if (!(await win.isMaximizable())) return;
			if (await win.isMaximized()) {
				await win.unmaximize();
			} else {
				await win.maximize();
			}
		} catch (err) {
			if (import.meta.env.DEV) console.warn(err);
		}
	}, [props.onMaximized]);

	const onMinimized = useCallback(async () => {
		if (props.onMinimized) return props.onMinimized();
		try {
			const tauriWin = import("@tauri-apps/api/window");
			const win = (await tauriWin).getCurrentWindow();
			if (!(await win.isMinimizable())) return;
			await win.minimize();
		} catch (err) {
			if (import.meta.env.DEV) console.warn(err);
		}
	}, [props.onMinimized]);

	const systemControls: ReactNode = (() => {
		if (variant === "windows") {
			return (
				<WindowsSystemsControls
					isMaximized={false}
					onClosed={onClosed}
					onMaximized={onMaximized}
					onMinimized={onMinimized}
				/>
			);
		} else if (variant === "macos") {
			return (
				<MacOSSystemsControls
					isMaximized={false}
					onClosed={onClosed}
					onMaximized={onMaximized}
					onMinimized={onMinimized}
				/>
			);
		} else if (variant === "gtk") {
		} else {
			return null;
		}
	})();

	return (
		<div className={styles.windowControls}>
			{placeLeft && systemControls}
			<div className={styles.slot}>{props.startChildren}</div>
			<div className={styles.spacer} data-tauri-drag-region />
			<div className={styles.slot} data-tauri-drag-region>
				{props.titleChildren}
			</div>
			<div className={styles.spacer} data-tauri-drag-region />
			<div className={styles.slot}>{props.endChildren}</div>
			{!placeLeft && systemControls}
		</div>
	);
}
