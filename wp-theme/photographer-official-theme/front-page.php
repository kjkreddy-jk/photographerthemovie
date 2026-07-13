<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$template_file = get_template_directory() . '/index.html';

if ( ! file_exists( $template_file ) ) {
	status_header( 500 );
	wp_die( esc_html__( 'Theme template file is missing.', 'photographer-official-theme' ) );
}

$html = file_get_contents( $template_file );

if ( false === $html ) {
	status_header( 500 );
	wp_die( esc_html__( 'Theme template file could not be read.', 'photographer-official-theme' ) );
}

ob_start();
wp_head();
$wp_head_markup = ob_get_clean();

ob_start();
if ( function_exists( 'wp_body_open' ) ) {
	wp_body_open();
}
$wp_body_open_markup = ob_get_clean();

ob_start();
wp_footer();
$wp_footer_markup = ob_get_clean();

$theme_version = wp_get_theme()->get( 'Version' );
$theme_asset_url = static function ( $file ) use ( $theme_version ) {
	return esc_url(
		add_query_arg(
			'ver',
			$theme_version,
			get_template_directory_uri() . '/' . $file
		)
	);
};

$html = str_replace(
	array(
		'<script src="./site-content.js" defer></script>',
		'<script src="./support.js" defer></script>',
		'<link rel="stylesheet" href="./site.css">',
	),
	array(
		sprintf( '<script src="%s" defer></script>', $theme_asset_url( 'site-content.js' ) ),
		sprintf( '<script src="%s" defer></script>', $theme_asset_url( 'support.js' ) ),
		sprintf( '<link rel="stylesheet" href="%s">', $theme_asset_url( 'site.css' ) ),
	),
	$html
);

if ( ! headers_sent() ) {
	header( 'X-Photographer-Site-Version: ' . $theme_version );
}

$body_open_tag = sprintf(
	'<body class="%s">%s',
	esc_attr( implode( ' ', get_body_class() ) ),
	$wp_body_open_markup
);

$html = str_replace( '</head>', $wp_head_markup . PHP_EOL . '</head>', $html );
$html = preg_replace( '/<body[^>]*>/', $body_open_tag, $html, 1 );
$html = str_replace( '</body>', $wp_footer_markup . PHP_EOL . '</body>', $html );

echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
